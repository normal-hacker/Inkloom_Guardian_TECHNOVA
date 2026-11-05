import crypto from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { sha256 } from '../engine/sha256';
import { normaliseNewlines } from './extract';

export interface CreateContentParams {
  workspaceId: string;
  ownerId: string;
  title: string;
  contentType: string;
  textBody: string;
  sourceKind?: string;
  originalFilename?: string;
  originalBytes?: string;
  imageAltText?: string;
}

export async function createContent(params: CreateContentParams) {
  const textBody = normaliseNewlines(params.textBody);
  const contentHash = sha256(textBody);
  const itemId = crypto.randomUUID();
  const versionId = crypto.randomUUID();

  // 1. Insert content item
  await db.insert(schema.contentItems).values({
    id: itemId,
    workspaceId: params.workspaceId,
    title: params.title,
    contentType: params.contentType,
    status: 'draft',
    ownerId: params.ownerId,
    currentVersionId: versionId,
  });

  // 2. Insert initial version (v1)
  await db.insert(schema.contentVersions).values({
    id: versionId,
    contentItemId: itemId,
    versionNo: 1,
    textBody,
    contentHash,
    sourceKind: params.sourceKind || 'paste',
    originalFilename: params.originalFilename,
    originalBytes: params.originalBytes,
    imageAltText: params.imageAltText,
    changeNote: 'Initial draft',
    createdBy: params.ownerId,
  });

  // 3. Log audit event
  await db.insert(schema.auditLog).values({
    workspaceId: params.workspaceId,
    actorId: params.ownerId,
    action: 'content.create',
    entityType: 'content_item',
    entityId: itemId,
    contentHash,
    detail: { title: params.title, contentType: params.contentType, version: 1 },
  });

  return { itemId, versionId, contentHash };
}

export async function createNewVersion(
  contentItemId: string,
  userId: string,
  workspaceId: string,
  textBodyRaw: string,
  changeNote?: string
) {
  const textBody = normaliseNewlines(textBodyRaw);
  const contentHash = sha256(textBody);

  // Get current max version
  const versions = await db
    .select({ versionNo: schema.contentVersions.versionNo })
    .from(schema.contentVersions)
    .where(eq(schema.contentVersions.contentItemId, contentItemId))
    .orderBy(desc(schema.contentVersions.versionNo))
    .limit(1);

  const nextVersionNo = (versions[0]?.versionNo || 0) + 1;
  const versionId = crypto.randomUUID();

  // Insert new version
  await db.insert(schema.contentVersions).values({
    id: versionId,
    contentItemId,
    versionNo: nextVersionNo,
    textBody,
    contentHash,
    sourceKind: 'edit',
    changeNote: changeNote || `Updated to version ${nextVersionNo}`,
    createdBy: userId,
  });

  // Update content item status to draft & currentVersionId
  await db
    .update(schema.contentItems)
    .set({
      currentVersionId: versionId,
      status: 'draft',
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId));

  // Log audit
  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: userId,
    action: 'version.create',
    entityType: 'content_version',
    entityId: versionId,
    contentHash,
    detail: { versionNo: nextVersionNo, changeNote },
  });

  return { versionId, versionNo: nextVersionNo, contentHash };
}

export async function applySuggestion(
  contentItemId: string,
  versionNo: number,
  userId: string,
  workspaceId: string,
  spanStart: number,
  spanEnd: number,
  quote: string,
  suggestion: string,
  ruleKey: string
) {
  // Get current version text
  const current = await db
    .select()
    .from(schema.contentVersions)
    .where(eq(schema.contentVersions.contentItemId, contentItemId))
    .orderBy(desc(schema.contentVersions.versionNo))
    .limit(1);

  if (!current.length) {
    throw new Error('Version not found.');
  }

  const curr = current[0];
  const oldText = curr.textBody;

  // Verify slice matches quote
  if (oldText.slice(spanStart, spanEnd) !== quote) {
    throw new Error('Target text has changed or offsets do not match.');
  }

  // Replace only the quoted span
  const newText = oldText.slice(0, spanStart) + suggestion + oldText.slice(spanEnd);

  // Create new version with change note
  const changeNote = `Applied suggestion for ${ruleKey}: "${quote}" → "${suggestion}"`;
  const result = await createNewVersion(contentItemId, userId, workspaceId, newText, changeNote);

  return result;
}
