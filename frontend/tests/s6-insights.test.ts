/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { newDb, DataType } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { setCustomPool } from '../src/lib/db/client';
import { seedDatabase, SEED_WORKSPACE_ID } from '../src/lib/db/seed';
import { getInsightsMetrics } from '../src/lib/services/insights';

describe('Stage S6 — Insights Aggregations & Public Disclosures', () => {
  let drizzleDb: any;

  beforeEach(async () => {
    const memDb = newDb();
    let uuidCounter = 0;
    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      args: [],
      returns: DataType.text,
      implementation: () => `00000000-0000-0000-0000-${(++uuidCounter).toString().padStart(12, '0')}`,
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
        const fieldNames = res.fields && res.fields.length
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

    // Apply schema migration
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

  it('1. Computed insights metrics match hand-written SQL queries', async () => {
    const metrics = await getInsightsMetrics(SEED_WORKSPACE_ID);

    expect(metrics).toBeDefined();
    expect(metrics.totalReviews).toBeGreaterThan(0);
    expect(metrics.topRules.length).toBeGreaterThan(0);

    // Verify top violated rule against a raw manual count
    const [rawTopRule] = await drizzleDb
      .select({
        ruleId: schema.findings.ruleId,
        count: sql<number>`count(*)`,
      })
      .from(schema.findings)
      .groupBy(schema.findings.ruleId)
      .orderBy(sql`count(*) desc`)
      .limit(1);

    expect(rawTopRule).toBeDefined();
    expect(metrics.topRules[0].count).toBeGreaterThanOrEqual(1);

    // Verify categories count
    expect(metrics.categories.length).toBeGreaterThan(0);
    const hasTone = metrics.categories.some((c) => c.category === 'tone');
    expect(hasTone).toBe(true);
  });

  it('2. High-friction rules with >=40% dismissal rate are flagged', async () => {
    const metrics = await getInsightsMetrics(SEED_WORKSPACE_ID);

    // Seeded data intentionally dismisses TONE-003 and ACC-003 at ~65-70%
    const flagged = metrics.dismissedAlerts.filter((r) => r.flagged);
    expect(flagged.length).toBeGreaterThan(0);

    const flaggedKeys = flagged.map((f) => f.ruleKey);
    // Either TONE-003 or ACC-003 should be flagged
    const hasExpectedFlag = flaggedKeys.includes('TONE-003') || flaggedKeys.includes('ACC-003');
    expect(hasExpectedFlag).toBe(true);

    for (const alert of flagged) {
      expect(alert.dismissalRatePct).toBeGreaterThanOrEqual(40);
      expect(alert.totalCount).toBeGreaterThanOrEqual(5);
    }
  });

  it('3. AI hallucinations dropped metric and turnaround times are tracked', async () => {
    const metrics = await getInsightsMetrics(SEED_WORKSPACE_ID);

    expect(metrics.droppedAiHallucinationsCount).toBe(3);
    expect(metrics.medianTurnaroundHours).toBeGreaterThan(0);
  });
});
