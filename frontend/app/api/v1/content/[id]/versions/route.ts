import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { requireAuth, assertContentAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/api/errors';
import { createNewVersion } from '@/lib/services/content';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = requireAuth(req);
  } catch (err: any) {
    return apiError(err.status || 401, err.code || 'unauthenticated', err.message, requestId);
  }

  const { id } = await params;

  try {
    const items = await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, id)).limit(1);
    if (!items.length) {
      return apiError(404, 'not_found', 'Content item not found.', requestId);
    }
    assertContentAccess(session, items[0]);

    const versions = await db
      .select()
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.contentItemId, id))
      .orderBy(desc(schema.contentVersions.versionNo));

    return NextResponse.json({ versions }, { status: 200, headers: { 'X-Request-ID': requestId } });
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Failed to list versions.', requestId);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = requireAuth(req);
  } catch (err: any) {
    return apiError(err.status || 401, err.code || 'unauthenticated', err.message, requestId);
  }

  const { id } = await params;

  try {
    const items = await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, id)).limit(1);
    if (!items.length) {
      return apiError(404, 'not_found', 'Content item not found.', requestId);
    }
    assertContentAccess(session, items[0]);

    const body = await req.json();
    const { textBody, changeNote } = body;

    if (!textBody && textBody !== '') {
      return apiError(400, 'bad_request', 'Text body is required.', requestId);
    }

    const result = await createNewVersion(id, session.sub, session.wid, textBody, changeNote);

    return NextResponse.json(result, { status: 201, headers: { 'X-Request-ID': requestId } });
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Failed to create new version.', requestId);
  }
}
