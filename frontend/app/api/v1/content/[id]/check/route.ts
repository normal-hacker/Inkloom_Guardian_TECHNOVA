import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { requireAuth, assertContentAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/api/errors';
import { runCheckPipeline } from '@/lib/services/review';

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
    const items = await db
      .select()
      .from(schema.contentItems)
      .where(eq(schema.contentItems.id, id))
      .limit(1);

    if (!items.length) {
      return apiError(404, 'not_found', 'Content item not found.', requestId);
    }

    const item = items[0];
    assertContentAccess(session, item);

    if (!item.currentVersionId) {
      return apiError(400, 'bad_request', 'Content item has no versions to check.', requestId);
    }

    let enableAi = false;
    try {
      const body = await req.json();
      enableAi = Boolean(body.enableAi);
    } catch {
      // Body is optional
    }

    const result = await runCheckPipeline({
      contentItemId: item.id,
      versionId: item.currentVersionId,
      userId: session.sub,
      workspaceId: session.wid,
      enableAi,
    });

    return NextResponse.json(result, { status: 200, headers: { 'X-Request-ID': requestId } });
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Check pipeline failed.', requestId);
  }
}
