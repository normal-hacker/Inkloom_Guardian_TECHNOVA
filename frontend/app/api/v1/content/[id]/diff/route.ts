import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { requireAuth, assertContentAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/api/errors';
import { diffWords } from '@/lib/engine/diff';

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
  const url = new URL(req.url);
  const v1 = parseInt(url.searchParams.get('v1') || '1', 10);
  const v2 = parseInt(url.searchParams.get('v2') || '2', 10);

  try {
    const items = await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, id)).limit(1);
    if (!items.length) {
      return apiError(404, 'not_found', 'Content item not found.', requestId);
    }
    assertContentAccess(session, items[0]);

    const versions = await db
      .select()
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.contentItemId, id));

    const ver1 = versions.find((v) => v.versionNo === v1);
    const ver2 = versions.find((v) => v.versionNo === v2);

    if (!ver1 || !ver2) {
      return apiError(404, 'not_found', 'One or both versions not found for diff.', requestId);
    }

    const diff = diffWords(ver1.textBody, ver2.textBody);

    return NextResponse.json({ diff, v1, v2 }, { status: 200, headers: { 'X-Request-ID': requestId } });
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Failed to compute diff.', requestId);
  }
}
