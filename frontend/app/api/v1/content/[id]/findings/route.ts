import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
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
    const items = await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, id)).limit(1);
    if (!items.length) {
      return apiError(404, 'not_found', 'Content item not found.', requestId);
    }
    assertContentAccess(session, items[0]);

    if (!items[0].currentVersionId) {
      return NextResponse.json({ findings: [] }, { status: 200, headers: { 'X-Request-ID': requestId } });
    }

    // Get latest review run for the current version
    let runs = await db
      .select()
      .from(schema.reviewRuns)
      .where(eq(schema.reviewRuns.contentVersionId, items[0].currentVersionId))
      .orderBy(desc(schema.reviewRuns.startedAt))
      .limit(1);

    if (!runs.length) {
      const itemRuns = await db
        .select({
          run: schema.reviewRuns,
        })
        .from(schema.reviewRuns)
        .innerJoin(schema.contentVersions, eq(schema.reviewRuns.contentVersionId, schema.contentVersions.id))
        .where(eq(schema.contentVersions.contentItemId, id))
        .orderBy(desc(schema.reviewRuns.startedAt))
        .limit(1);

      if (itemRuns.length) {
        runs = [itemRuns[0].run];
      }
    }

    if (!runs.length) {
      return NextResponse.json({ findings: [] }, { status: 200, headers: { 'X-Request-ID': requestId } });
    }

    // Get findings joined with rules, sources, facts
    const findingsRows = await db
      .select({
        id: schema.findings.id,
        origin: schema.findings.origin,
        category: schema.findings.category,
        severity: schema.findings.severity,
        spanStart: schema.findings.spanStart,
        spanEnd: schema.findings.spanEnd,
        quote: schema.findings.quote,
        explanation: schema.findings.explanation,
        suggestion: schema.findings.suggestion,
        confidence: schema.findings.confidence,
        status: schema.findings.status,
        ruleKey: schema.rules.key,
        ruleTitle: schema.rules.title,
        sourceDoc: schema.guidelineSources.title,
        sourceSection: schema.rules.sourceSection,
        factKey: schema.approvedFacts.key,
        factStatement: schema.approvedFacts.statement,
      })
      .from(schema.findings)
      .leftJoin(schema.rules, eq(schema.findings.ruleId, schema.rules.id))
      .leftJoin(schema.guidelineSources, eq(schema.rules.sourceId, schema.guidelineSources.id))
      .leftJoin(schema.approvedFacts, eq(schema.findings.factId, schema.approvedFacts.id))
      .where(eq(schema.findings.reviewRunId, runs[0].id));

    return NextResponse.json(
      {
        run: runs[0],
        findings: findingsRows,
      },
      { status: 200, headers: { 'X-Request-ID': requestId } }
    );
  } catch (err: any) {
    return apiError(500, 'internal_error', err.message || 'Failed to get findings.', requestId);
  }
}
