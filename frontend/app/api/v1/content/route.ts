import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { requireAuth, assertContentAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/api/errors';
import { createContent } from '@/lib/services/content';

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = requireAuth(req);
  } catch (err: any) {
    return apiError(err.status || 401, err.code || 'unauthenticated', err.message, requestId);
  }

  try {
    const body = await req.json();
    const { title, contentType, textBody, sourceKind, originalFilename, imageAltText } = body;

    if (!title || typeof title !== 'string') {
      return apiError(400, 'bad_request', 'Title is required.', requestId);
    }
    if (!contentType || typeof contentType !== 'string') {
      return apiError(400, 'bad_request', 'Content type is required.', requestId);
    }
    if (!textBody && textBody !== '') {
      return apiError(400, 'bad_request', 'Text body is required.', requestId);
    }

    const result = await createContent({
      workspaceId: session.wid,
      ownerId: session.sub,
      title: title.trim(),
      contentType,
      textBody: String(textBody),
      sourceKind: sourceKind || 'paste',
      originalFilename,
      imageAltText,
    });

    return NextResponse.json(
      {
        item: {
          id: result.itemId,
          title: title.trim(),
          contentType,
          status: 'draft',
          currentVersionId: result.versionId,
          versionNo: 1,
          contentHash: result.contentHash,
        },
      },
      { status: 201, headers: { 'X-Request-ID': requestId } }
    );
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Failed to create content item.', requestId);
  }
}

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = requireAuth(req);
  } catch (err: any) {
    return apiError(err.status || 401, err.code || 'unauthenticated', err.message, requestId);
  }

  try {
    // If creator, select only own items. Reviewer/manager select all workspace items.
    let items;
    if (session.role === 'creator') {
      items = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.ownerId, session.sub))
        .orderBy(desc(schema.contentItems.updatedAt));
    } else {
      items = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.workspaceId, session.wid))
        .orderBy(desc(schema.contentItems.updatedAt));
    }

    return NextResponse.json({ items }, { status: 200, headers: { 'X-Request-ID': requestId } });
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Failed to list content items.', requestId);
  }
}
