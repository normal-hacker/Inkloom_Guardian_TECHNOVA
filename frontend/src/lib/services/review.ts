import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { runRules } from '../engine/rules';
import { redact, restoreSpan } from '../engine/redact';
import { validateAiFindings } from '../engine/validator';
import { deduplicateAndRankFindings } from '../engine/dedup';
import { getAiProvider, recordAiSuccess, recordAiFailure } from '../ai';
import { Finding } from '../engine/types';

export interface RunCheckParams {
  contentItemId: string;
  versionId: string;
  userId: string;
  workspaceId: string;
  enableAi?: boolean;
}

export async function runCheckPipeline(params: RunCheckParams) {
  // 1. Fetch active rule set
  const activeRuleSets = await db
    .select()
    .from(schema.ruleSets)
    .where(
      and(
        eq(schema.ruleSets.workspaceId, params.workspaceId),
        eq(schema.ruleSets.status, 'active')
      )
    )
    .limit(1);

  const activeRuleSet = activeRuleSets[0];
  const ruleSetId = activeRuleSet?.id;
  const ruleSetVersion = activeRuleSet?.version ?? 3;

  // 2. Fetch content version
  const versions = await db
    .select()
    .from(schema.contentVersions)
    .where(eq(schema.contentVersions.id, params.versionId))
    .limit(1);

  if (!versions.length) {
    throw new Error('Content version not found.');
  }

  const version = versions[0];
  const textBody = version.textBody;
  const contentHash = version.contentHash;

  // 3. Cache check: If an identical check completed for (rule_set_id, content_hash)
  const cachedRuns = await db
    .select()
    .from(schema.reviewRuns)
    .where(
      and(
        eq(schema.reviewRuns.contentVersionId, version.id),
        eq(schema.reviewRuns.ruleSetId, ruleSetId),
        eq(schema.reviewRuns.status, 'complete')
      )
    )
    .limit(1);

  if (cachedRuns.length > 0) {
    const cachedRun = cachedRuns[0];
    const cachedFindings = await db
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.reviewRunId, cachedRun.id));

    return {
      run: cachedRun,
      findings: cachedFindings,
      cached: true,
    };
  }

  // 4. Create review run record with status 'running'
  const runId = crypto.randomUUID();
  await db.insert(schema.reviewRuns).values({
    id: runId,
    contentVersionId: version.id,
    ruleSetId,
    status: 'running',
    startedAt: new Date(),
  });

  let runStatus: 'complete' | 'rules_only_ai_failed' | 'error' = 'complete';
  let aiMetrics: any = null;
  const allFindings: Finding[] = [];

  try {
    // 5. Run local deterministic rule engine
    const localFindings = runRules(textBody, {
      ruleSetVersion,
      imageAltText: version.imageAltText || undefined,
    });
    allFindings.push(...localFindings);

    // 6. Optional AI pass (Agents.md A2/A3/A4)
    if (params.enableAi) {
      const { redactedText, segments } = redact(textBody);
      const aiProvider = getAiProvider();

      try {
        const rulesSummary =
          'Detect brand tone, superlatives, unsubstantiated claims, and comparative messaging.';
        const aiResult = await aiProvider.checkContent(redactedText, rulesSummary, 15000);
        aiMetrics = aiResult.metrics;

        if (aiResult.metrics.status === 'ok') {
          // Restore original offsets from redacted text
          const restoredAiFindings = aiResult.findings.map((f) => {
            const restored = restoreSpan(f.spanStart, f.spanEnd, segments);
            return {
              ...f,
              spanStart: restored.start,
              spanEnd: restored.end,
              quote: textBody.slice(restored.start, restored.end),
            };
          });

          // Validate AI findings
          const validatedAi = validateAiFindings(restoredAiFindings, textBody);
          allFindings.push(...validatedAi);
          recordAiSuccess();
        } else {
          runStatus = 'rules_only_ai_failed';
          recordAiFailure();
        }
      } catch (aiErr) {
        console.warn('AI provider failed, falling back to rule engine:', aiErr);
        runStatus = 'rules_only_ai_failed';
        recordAiFailure();
      }
    }

    // 7. Deduplicate overlapping findings (higher severity wins, tie -> rule order)
    const finalFindings = deduplicateAndRankFindings(allFindings, textBody, 50);

    // Count severities
    const counts = { blocker: 0, major: 0, minor: 0, info: 0 };
    for (const f of finalFindings) {
      if (counts[f.severity] !== undefined) {
        counts[f.severity]++;
      }
    }

    // 8. Persist findings to database
    for (const f of finalFindings) {
      // Find matching rule id or fact id
      const ruleRows = await db
        .select({ id: schema.rules.id })
        .from(schema.rules)
        .where(
          and(
            eq(schema.rules.ruleSetId, ruleSetId),
            eq(schema.rules.key, f.ruleKey)
          )
        )
        .limit(1);

      const ruleId = ruleRows[0]?.id;

      // Grounding guarantee: rule_id must be present for schema constraint
      if (ruleId) {
        await db.insert(schema.findings).values({
          reviewRunId: runId,
          origin: f.origin,
          category: f.category,
          severity: f.severity,
          ruleId,
          spanStart: f.spanStart,
          spanEnd: f.spanEnd,
          quote: f.quote,
          explanation: f.explanation,
          suggestion: f.suggestion,
          confidence: typeof f.confidence === 'number' ? f.confidence.toFixed(2) : String(f.confidence),
          status: 'open',
        });
      }
    }

    // 9. Persist ai_calls metrics if AI was called
    if (aiMetrics) {
      await db.insert(schema.aiCalls).values({
        id: crypto.randomUUID(),
        reviewRunId: runId,
        provider: aiMetrics.provider,
        model: aiMetrics.model,
        latencyMs: aiMetrics.latencyMs,
        status: aiMetrics.status,
        rawOutput: aiMetrics.rawOutput,
      });
    }

    // 10. Finalize review run
    await db
      .update(schema.reviewRuns)
      .set({
        status: runStatus,
        finishedAt: new Date(),
        counts,
        aiProvider: aiMetrics?.provider,
        aiModel: aiMetrics?.model,
      })
      .where(eq(schema.reviewRuns.id, runId));

    // 11. Update content item status to 'checked'
    await db
      .update(schema.contentItems)
      .set({
        status: 'checked',
        updatedAt: new Date(),
      })
      .where(eq(schema.contentItems.id, params.contentItemId));

    // 12. Log audit event
    await db.insert(schema.auditLog).values({
      workspaceId: params.workspaceId,
      actorId: params.userId,
      action: 'review.run',
      entityType: 'review_run',
      entityId: runId,
      contentHash,
      ruleSetId,
      detail: { counts, status: runStatus },
    });

    return {
      runId,
      status: runStatus,
      counts,
      findings: finalFindings,
    };
  } catch (err: any) {
    // If check pipeline fails, mark review_run as error
    await db
      .update(schema.reviewRuns)
      .set({
        status: 'error',
        finishedAt: new Date(),
        errorDetail: err.message,
      })
      .where(eq(schema.reviewRuns.id, runId));

    throw err;
  }
}
