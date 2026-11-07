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

export interface ApplySuggestionParams {
  contentItemId: string;
  versionNo?: number;
  userId: string;
  workspaceId: string;
  spanStart: number;
  spanEnd: number;
  quote: string;
  suggestion: string;
  ruleKey?: string;
  findingId?: string;
}

export async function applySuggestion(
  paramsOrContentItemId: string | ApplySuggestionParams,
  ...rest: any[]
) {
  let params: ApplySuggestionParams;
  if (typeof paramsOrContentItemId === 'object') {
    params = paramsOrContentItemId;
  } else {
    params = {
      contentItemId: paramsOrContentItemId,
      versionNo: rest[0],
      userId: rest[1],
      workspaceId: rest[2],
      spanStart: rest[3],
      spanEnd: rest[4],
      quote: rest[5],
      suggestion: rest[6],
      ruleKey: rest[7] || 'RULE',
      findingId: rest[8],
    };
  }

  const {
    contentItemId,
    userId,
    workspaceId,
    spanStart,
    spanEnd,
    quote,
    suggestion,
    ruleKey = 'RULE',
    findingId,
  } = params;

  // 1. Get current version text for this content item
  const current = await db
    .select()
    .from(schema.contentVersions)
    .where(eq(schema.contentVersions.contentItemId, contentItemId))
    .orderBy(desc(schema.contentVersions.versionNo))
    .limit(1);

  if (!current.length) {
    throw new Error('Content version not found.');
  }

  const curr = current[0];
  const oldText = curr.textBody;

  // 2. Locate the target occurrence in oldText
  let targetStart = -1;
  let targetEnd = -1;

  // Priority 1: Exact match at original offsets
  if (
    spanStart >= 0 &&
    spanEnd <= oldText.length &&
    oldText.slice(spanStart, spanEnd) === quote
  ) {
    targetStart = spanStart;
    targetEnd = spanEnd;
  } else {
    // Priority 2: Offsets shifted from prior edits or suggestions
    const occurrences: number[] = [];
    let idx = oldText.indexOf(quote);
    while (idx !== -1) {
      occurrences.push(idx);
      idx = oldText.indexOf(quote, idx + 1);
    }

    if (occurrences.length === 0) {
      throw new Error(`Target text "${quote}" could not be found in the current document version.`);
    }

    if (occurrences.length === 1) {
      targetStart = occurrences[0];
      targetEnd = targetStart + quote.length;
    } else {
      // Pick the occurrence closest to original spanStart to prevent replacing wrong occurrence
      let closestIdx = occurrences[0];
      let minDiff = Math.abs(occurrences[0] - spanStart);
      for (let i = 1; i < occurrences.length; i++) {
        const diff = Math.abs(occurrences[i] - spanStart);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = occurrences[i];
        }
      }
      targetStart = closestIdx;
      targetEnd = targetStart + quote.length;
    }
  }

  // 3. Replace only the target quoted span
  const newText = oldText.slice(0, targetStart) + suggestion + oldText.slice(targetEnd);

  // 4. Create new version with change note
  const changeNote = `Applied suggestion for ${ruleKey}: "${quote}" → "${suggestion}"`;
  const result = await createNewVersion(contentItemId, userId, workspaceId, newText, changeNote);

  // 5. If findingId is provided, update finding status and record decision & audit
  if (findingId) {
    await db
      .update(schema.findings)
      .set({ status: 'fixed' })
      .where(eq(schema.findings.id, findingId));

    await db.insert(schema.findingDecisions).values({
      id: crypto.randomUUID(),
      findingId,
      decidedBy: userId,
      decision: 'fixed',
      reason: `Applied suggestion: "${quote}" → "${suggestion}"`,
    });

    await db.insert(schema.auditLog).values({
      workspaceId,
      actorId: userId,
      action: 'finding.apply_suggestion',
      entityType: 'finding',
      entityId: findingId,
      contentHash: result.contentHash,
      detail: {
        contentItemId,
        versionNo: result.versionNo,
        quote,
        suggestion,
      },
    });
  }

  return {
    success: true,
    versionId: result.versionId,
    versionNo: result.versionNo,
    newVersionNo: result.versionNo,
    contentHash: result.contentHash,
    findingId,
    newText,
    status: 'fixed',
  };
}
