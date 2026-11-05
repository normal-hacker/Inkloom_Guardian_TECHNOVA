import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { requireAuth, assertContentAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/api/errors';
import { applySuggestion } from '@/lib/services/content';

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
    const { versionNo, spanStart, spanEnd, quote, suggestion, ruleKey } = body;

    if (spanStart === undefined || spanEnd === undefined || !quote || !suggestion) {
      return apiError(400, 'bad_request', 'Missing required suggestion parameters.', requestId);
    }

    const result = await applySuggestion(
      id,
      versionNo || 1,
      session.sub,
      session.wid,
      spanStart,
      spanEnd,
      quote,
      suggestion,
      ruleKey || 'RULE'
    );

    return NextResponse.json(result, { status: 201, headers: { 'X-Request-ID': requestId } });
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Failed to apply suggestion.', requestId);
  }
}
