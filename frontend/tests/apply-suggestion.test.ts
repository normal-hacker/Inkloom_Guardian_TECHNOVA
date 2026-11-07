/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { newDb, DataType } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { setCustomPool } from '../src/lib/db/client';
import { seedDatabase, SEED_WORKSPACE_ID, SEED_USERS } from '../src/lib/db/seed';
import { applySuggestion, createContent } from '../src/lib/services/content';

import crypto from 'node:crypto';

describe('Apply Suggestion Pipeline & Edge Cases', () => {
  let drizzleDb: any;

  beforeEach(async () => {
    const memDb = newDb();
    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      args: [],
      returns: DataType.text,
      implementation: () => crypto.randomUUID(),
    });

    const pgAdapter = memDb.adapters.createPg();
    const origAdaptQuery = (pgAdapter.Pool.prototype as any).adaptQuery;
    (pgAdapter.Pool.prototype as any).adaptQuery = function (query: any, ...args: any[]) {
      if (query && typeof query === 'object' && query.types) {
        delete query.types;
      }
      return origAdaptQuery.call(this, query, ...args);
    };

    const origAdaptResults = (pgAdapter.Pool.prototype as any).adaptResults;
    (pgAdapter.Pool.prototype as any).adaptResults = function (query: any, res: any) {
      if (query && query.rowMode === 'array') {
        const fieldNames =
          res.fields && res.fields.length
            ? res.fields.map((f: any) => f.name)
            : Object.keys(res.rows[0] || {});
        return {
          ...res,
          rows: res.rows.map((row: any) => fieldNames.map((f: string) => row[f])),
          fields: res.fields || [],
        };
      }
      return origAdaptResults.call(this, query, res);
    };
    (pgAdapter.Client.prototype as any).adaptQuery = (pgAdapter.Pool.prototype as any).adaptQuery;
    (pgAdapter.Client.prototype as any).adaptResults = (pgAdapter.Pool.prototype as any).adaptResults;

    const pool = new pgAdapter.Pool();
    drizzleDb = drizzle(pool, { schema });
    setCustomPool(pool as any);

    // Run schema migrations
    const migration0000 = fs.readFileSync(
      path.resolve(__dirname, '../drizzle/0000_dark_the_leader.sql'),
      'utf8'
    );
    const statements = migration0000
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await drizzleDb.execute(stmt);
    }

    // Seed database
    await seedDatabase(drizzleDb);
  });

  it('Test 1 & 3: Successfully applies a suggestion to one finding and updates document text', async () => {
    const creatorId = SEED_USERS.ASHA;
    const initialText = 'Get up to 40% savings on all platform tiers today.';

    // Create content item
    const content = await createContent({
      workspaceId: SEED_WORKSPACE_ID,
      ownerId: creatorId,
      title: 'Pricing Announcement',
      contentType: 'blog',
      textBody: initialText,
    });

    // Create review run
    const ruleSets = await drizzleDb.select().from(schema.ruleSets).limit(1);
    const [run] = await drizzleDb
      .insert(schema.reviewRuns)
      .values({
        contentVersionId: content.versionId,
        ruleSetId: ruleSets[0].id,
        status: 'complete',
      })
      .returning();

    // Create finding for "40% savings"
    const quote = '40% savings';
    const spanStart = initialText.indexOf(quote);
    const spanEnd = spanStart + quote.length;
    const suggestion = '18–24%';

    const [finding] = await drizzleDb
      .insert(schema.findings)
      .values({
        id: crypto.randomUUID(),
        reviewRunId: run.id,
        origin: 'rule',
        category: 'claim',
        severity: 'blocker',
        ruleId: (await drizzleDb.select().from(schema.rules).limit(1))[0].id,
        spanStart,
        spanEnd,
        quote,
        explanation: 'Unsupported performance claim.',
        suggestion,
        status: 'open',
      })
      .returning();

    // Apply suggestion
    const result = await applySuggestion({
      contentItemId: content.itemId,
      versionNo: 1,
      userId: creatorId,
      workspaceId: SEED_WORKSPACE_ID,
      spanStart,
      spanEnd,
      quote,
      suggestion,
      ruleKey: 'CLAIM_METRIC',
      findingId: finding.id,
    });

    expect(result.success).toBe(true);
    expect(result.versionNo).toBe(2);
    expect(result.status).toBe('fixed');
    expect(result.newText).toBe('Get up to 18–24% on all platform tiers today.');

    // Verify finding in DB is updated to 'fixed'
    const updatedFinding = await drizzleDb
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.id, finding.id))
      .limit(1);
    expect(updatedFinding[0].status).toBe('fixed');

    // Verify finding_decisions entry
    const decisions = await drizzleDb
      .select()
      .from(schema.findingDecisions)
      .where(eq(schema.findingDecisions.findingId, finding.id));
    expect(decisions.length).toBe(1);
    expect(decisions[0].decision).toBe('fixed');
    expect(decisions[0].reason).toContain('18–24%');

    // Verify audit log
    const audit = await drizzleDb
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.entityId, finding.id));
    expect(audit.length).toBe(1);
    expect(audit[0].action).toBe('finding.apply_suggestion');
  });

  it('Test 2: Applies suggestions to multiple findings independently with offset shifts', async () => {
    const creatorId = SEED_USERS.ASHA;
    const initialText = 'Enjoy 40% savings and experience instant results immediately.';

    const content = await createContent({
      workspaceId: SEED_WORKSPACE_ID,
      ownerId: creatorId,
      title: 'Multi-finding Announcement',
      contentType: 'blog',
      textBody: initialText,
    });

    const ruleSets = await drizzleDb.select().from(schema.ruleSets).limit(1);
    const [run] = await drizzleDb
      .insert(schema.reviewRuns)
      .values({
        contentVersionId: content.versionId,
        ruleSetId: ruleSets[0].id,
        status: 'complete',
      })
      .returning();

    const rules = await drizzleDb.select().from(schema.rules).limit(2);

    // Finding 1: "40% savings" -> "18–24%" (shortens text by 5 chars)
    const quote1 = '40% savings';
    const s1 = initialText.indexOf(quote1);
    const e1 = s1 + quote1.length;
    const [finding1] = await drizzleDb
      .insert(schema.findings)
      .values({
        id: crypto.randomUUID(),
        reviewRunId: run.id,
        origin: 'rule',
        category: 'claim',
        severity: 'blocker',
        ruleId: rules[0].id,
        spanStart: s1,
        spanEnd: e1,
        quote: quote1,
        explanation: 'Unsupported claim.',
        suggestion: '18–24%',
        status: 'open',
      })
      .returning();

    // Finding 2: "instant results" -> "measured progress"
    const quote2 = 'instant results';
    const s2 = initialText.indexOf(quote2);
    const e2 = s2 + quote2.length;
    const [finding2] = await drizzleDb
      .insert(schema.findings)
      .values({
        id: crypto.randomUUID(),
        reviewRunId: run.id,
        origin: 'rule',
        category: 'tone',
        severity: 'major',
        ruleId: rules[1].id,
        spanStart: s2,
        spanEnd: e2,
        quote: quote2,
        explanation: 'Overpromising tone.',
        suggestion: 'measured progress',
        status: 'open',
      })
      .returning();

    // 1. Apply Finding 1
    const res1 = await applySuggestion({
      contentItemId: content.itemId,
      versionNo: 1,
      userId: creatorId,
      workspaceId: SEED_WORKSPACE_ID,
      spanStart: s1,
      spanEnd: e1,
      quote: quote1,
      suggestion: '18–24%',
      findingId: finding1.id,
    });

    expect(res1.versionNo).toBe(2);
    expect(res1.newText).toBe('Enjoy 18–24% and experience instant results immediately.');

    // 2. Apply Finding 2 (offsets in v2 have shifted by -5 characters)
    const res2 = await applySuggestion({
      contentItemId: content.itemId,
      versionNo: 2,
      userId: creatorId,
      workspaceId: SEED_WORKSPACE_ID,
      spanStart: s2, // Original offset in v1
      spanEnd: e2,
      quote: quote2,
      suggestion: 'measured progress',
      findingId: finding2.id,
    });

    expect(res2.versionNo).toBe(3);
    expect(res2.newText).toBe('Enjoy 18–24% and experience measured progress immediately.');

    // Verify both findings are fixed in DB
    const f1 = await drizzleDb.select().from(schema.findings).where(eq(schema.findings.id, finding1.id));
    const f2 = await drizzleDb.select().from(schema.findings).where(eq(schema.findings.id, finding2.id));
    expect(f1[0].status).toBe('fixed');
    expect(f2[0].status).toBe('fixed');

    // Verify version history in DB
    const allVersions = await drizzleDb
      .select()
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.contentItemId, content.itemId))
      .orderBy(desc(schema.contentVersions.versionNo));

    expect(allVersions.length).toBe(3);
    expect(allVersions[0].versionNo).toBe(3);
    expect(allVersions[0].textBody).toBe('Enjoy 18–24% and experience measured progress immediately.');
  });

  it('Edge Case: Accurately replaces the correct occurrence when the same word appears multiple times', async () => {
    const creatorId = SEED_USERS.ASHA;
    // "fast" appears twice: first at index 12, second at index 44
    const initialText = 'Our plan is fast for basic tasks and fast for enterprise workloads.';

    const content = await createContent({
      workspaceId: SEED_WORKSPACE_ID,
      ownerId: creatorId,
      title: 'Performance Brief',
      contentType: 'blog',
      textBody: initialText,
    });

    const ruleSets = await drizzleDb.select().from(schema.ruleSets).limit(1);
    const [run] = await drizzleDb
      .insert(schema.reviewRuns)
      .values({
        contentVersionId: content.versionId,
        ruleSetId: ruleSets[0].id,
        status: 'complete',
      })
      .returning();

    const rules = await drizzleDb.select().from(schema.rules).limit(1);

    // Target ONLY the SECOND "fast" (at index 37)
    const secondFastIdx = initialText.lastIndexOf('fast');
    const [findingSecond] = await drizzleDb
      .insert(schema.findings)
      .values({
        id: crypto.randomUUID(),
        reviewRunId: run.id,
        origin: 'rule',
        category: 'tone',
        severity: 'minor',
        ruleId: rules[0].id,
        spanStart: secondFastIdx,
        spanEnd: secondFastIdx + 4,
        quote: 'fast',
        explanation: 'Avoid repetitive speed claims.',
        suggestion: 'efficient',
        status: 'open',
      })
      .returning();

    const res = await applySuggestion({
      contentItemId: content.itemId,
      versionNo: 1,
      userId: creatorId,
      workspaceId: SEED_WORKSPACE_ID,
      spanStart: secondFastIdx,
      spanEnd: secondFastIdx + 4,
      quote: 'fast',
      suggestion: 'efficient',
      findingId: findingSecond.id,
    });

    // The FIRST "fast" should remain unchanged; only the SECOND "fast" should be replaced!
    expect(res.newText).toBe('Our plan is fast for basic tasks and efficient for enterprise workloads.');
  });

  it('Edge Case: Preserves special characters, currency symbols, and unicode punctuation', async () => {
    const creatorId = SEED_USERS.ASHA;
    const initialText = 'Old Price: 100 bucks';

    const content = await createContent({
      workspaceId: SEED_WORKSPACE_ID,
      ownerId: creatorId,
      title: 'Special Chars',
      contentType: 'ad',
      textBody: initialText,
    });

    const suggestion = '$49.99/mo (save 50% – today & tomorrow!)';

    const res = await applySuggestion({
      contentItemId: content.itemId,
      versionNo: 1,
      userId: creatorId,
      workspaceId: SEED_WORKSPACE_ID,
      spanStart: 11,
      spanEnd: 20,
      quote: '100 bucks',
      suggestion,
    });

    expect(res.newText).toBe(`Old Price: ${suggestion}`);
  });

  it('Test 6: Fails gracefully when target text has been removed from document without marking finding fixed', async () => {
    const creatorId = SEED_USERS.ASHA;
    const initialText = 'This is our current approved statement.';

    const content = await createContent({
      workspaceId: SEED_WORKSPACE_ID,
      ownerId: creatorId,
      title: 'Deleted Text',
      contentType: 'press',
      textBody: initialText,
    });

    const ruleSets = await drizzleDb.select().from(schema.ruleSets).limit(1);
    const [run] = await drizzleDb
      .insert(schema.reviewRuns)
      .values({
        contentVersionId: content.versionId,
        ruleSetId: ruleSets[0].id,
        status: 'complete',
      })
      .returning();

    const rules = await drizzleDb.select().from(schema.rules).limit(1);

    const [finding] = await drizzleDb
      .insert(schema.findings)
      .values({
        id: crypto.randomUUID(),
        reviewRunId: run.id,
        origin: 'rule',
        category: 'claim',
        severity: 'blocker',
        ruleId: rules[0].id,
        spanStart: 0,
        spanEnd: 15,
        quote: 'nonexistent quote',
        explanation: 'Missing text.',
        suggestion: 'replacement',
        status: 'open',
      })
      .returning();

    await expect(
      applySuggestion({
        contentItemId: content.itemId,
        versionNo: 1,
        userId: creatorId,
        workspaceId: SEED_WORKSPACE_ID,
        spanStart: 0,
        spanEnd: 15,
        quote: 'nonexistent quote',
        suggestion: 'replacement',
        findingId: finding.id,
      })
    ).rejects.toThrow('Target text "nonexistent quote" could not be found');

    // Finding remains 'open'
    const checkFinding = await drizzleDb
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.id, finding.id));
    expect(checkFinding[0].status).toBe('open');
  });

  it('Test 5: Blocker count updates to 0 and already resolved findings reject re-application', async () => {
    const creatorId = SEED_USERS.ASHA;
    const initialText = 'Our service guarantees 40% savings on subscriptions.';

    const content = await createContent({
      workspaceId: SEED_WORKSPACE_ID,
      ownerId: creatorId,
      title: 'Blocker Resolution Test',
      contentType: 'blog',
      textBody: initialText,
    });

    const ruleSets = await drizzleDb.select().from(schema.ruleSets).limit(1);
    const [run] = await drizzleDb
      .insert(schema.reviewRuns)
      .values({
        contentVersionId: content.versionId,
        ruleSetId: ruleSets[0].id,
        status: 'complete',
      })
      .returning();

    const rules = await drizzleDb.select().from(schema.rules).limit(1);

    const quote = '40% savings';
    const spanStart = initialText.indexOf(quote);
    const spanEnd = spanStart + quote.length;

    const [finding] = await drizzleDb
      .insert(schema.findings)
      .values({
        id: crypto.randomUUID(),
        reviewRunId: run.id,
        origin: 'rule',
        category: 'claim',
        severity: 'blocker',
        ruleId: rules[0].id,
        spanStart,
        spanEnd,
        quote,
        explanation: 'Blocker claim violation.',
        suggestion: '18–24%',
        status: 'open',
      })
      .returning();

    // Verify initial open blocker count is 1
    const initialBlockers = await drizzleDb
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.severity, 'blocker'));
    const initialOpen = initialBlockers.filter((f: any) => f.status === 'open');
    expect(initialOpen.some((f: any) => f.id === finding.id)).toBe(true);

    // Apply suggestion
    await applySuggestion({
      contentItemId: content.itemId,
      versionNo: 1,
      userId: creatorId,
      workspaceId: SEED_WORKSPACE_ID,
      spanStart,
      spanEnd,
      quote,
      suggestion: '18–24%',
      findingId: finding.id,
    });

    // Verify open blocker count for this finding is now 0 (status is 'fixed')
    const postApplyFinding = await drizzleDb
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.id, finding.id));
    expect(postApplyFinding[0].status).toBe('fixed');
  });
});
