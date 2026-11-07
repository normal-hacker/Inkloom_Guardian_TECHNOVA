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

    const body = await req.json().catch(() => ({}));
    const { findingId, suggestion, versionNo, spanStart, spanEnd, quote, ruleKey } = body;

    let targetSpanStart = spanStart;
    let targetSpanEnd = spanEnd;
    let targetQuote = quote;
    let targetSuggestion = suggestion;
    let targetRuleKey = ruleKey || 'RULE';

    if (findingId) {
      // 1. Fetch finding by unique ID
      const findingRows = await db
        .select({
          finding: schema.findings,
          run: schema.reviewRuns,
          version: schema.contentVersions,
          rule: schema.rules,
        })
        .from(schema.findings)
        .innerJoin(schema.reviewRuns, eq(schema.findings.reviewRunId, schema.reviewRuns.id))
        .innerJoin(schema.contentVersions, eq(schema.reviewRuns.contentVersionId, schema.contentVersions.id))
        .leftJoin(schema.rules, eq(schema.findings.ruleId, schema.rules.id))
        .where(eq(schema.findings.id, findingId))
        .limit(1);

      if (!findingRows.length) {
        return apiError(404, 'not_found', 'Finding not found.', requestId);
      }

      const { finding, version, rule } = findingRows[0];

      // Verify finding belongs to this content item
      if (version.contentItemId !== id) {
        return apiError(400, 'bad_request', 'Finding does not belong to this content item.', requestId);
      }

      // Check if finding has already been resolved
      if (finding.status !== 'open') {
        return apiError(400, 'bad_request', `Finding has already been ${finding.status}.`, requestId, {
          reason: 'already_resolved',
          status: finding.status,
        });
      }

      targetSpanStart = spanStart !== undefined ? spanStart : finding.spanStart;
      targetSpanEnd = spanEnd !== undefined ? spanEnd : finding.spanEnd;
      targetQuote = quote || finding.quote;
      targetSuggestion = suggestion || finding.suggestion;
      targetRuleKey = ruleKey || rule?.key || 'RULE';

      if (!targetSuggestion) {
        return apiError(400, 'bad_request', 'No suggested replacement available for this finding.', requestId);
      }
    } else {
      // Legacy payload without findingId
      if (spanStart === undefined || spanEnd === undefined || !quote || !suggestion) {
        return apiError(400, 'bad_request', 'Missing required suggestion parameters.', requestId);
      }
    }

    const result = await applySuggestion({
      contentItemId: id,
      versionNo: versionNo || 1,
      userId: session.sub,
      workspaceId: session.wid,
      spanStart: targetSpanStart,
      spanEnd: targetSpanEnd,
      quote: targetQuote,
      suggestion: targetSuggestion,
      ruleKey: targetRuleKey,
      findingId,
    });

    return NextResponse.json(result, { status: 201, headers: { 'X-Request-ID': requestId } });
  } catch (err: any) {
    const status = err.status || 400;
    return apiError(status, err.code || 'apply_suggestion_failed', err.message || 'Failed to apply suggestion.', requestId);
  }
}
