import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { requireAuth, assertContentAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/api/errors';

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
    const items = await db
      .select()
      .from(schema.contentItems)
      .where(eq(schema.contentItems.id, id))
      .limit(1);

    if (!items.length) {
      return apiError(404, 'not_found', 'Content item not found.', requestId);
    }

    const item = items[0];

    // Enforce object-level isolation (creators only see their own items -> 404)
    try {
      assertContentAccess(session, item);
    } catch {
      return apiError(404, 'not_found', 'Content item not found.', requestId);
    }

    // Fetch current version if present
    let currentVersion = null;
    if (item.currentVersionId) {
      const versions = await db
        .select()
        .from(schema.contentVersions)
        .where(eq(schema.contentVersions.id, item.currentVersionId))
        .limit(1);
      currentVersion = versions[0] || null;
    }

    return NextResponse.json(
      { item, currentVersion },
      { status: 200, headers: { 'X-Request-ID': requestId } }
    );
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Failed to get content item.', requestId);
  }
}
