import { describe, it, expect, beforeEach } from 'vitest';
import { initMemoryDatabase } from '../src/lib/db/memory-db';
import { setCustomPool } from '../src/lib/db/client';
import { getInsightsMetrics, shouldFlagGuidelineGap } from '../src/lib/services/insights';
import { SEED_WORKSPACE_ID, seedDatabase } from '../src/lib/db/seed';

describe('Round 3 Feature B: Guideline-Gap Detector', () => {
  beforeEach(async () => {
    const { pool, db } = initMemoryDatabase();
    setCustomPool(pool);
    await seedDatabase(db);
  });

  it('aggregates reviewer dismissals and flags rules dismissed >= 40%', async () => {
    const metrics = await getInsightsMetrics(SEED_WORKSPACE_ID);

    expect(metrics).toBeDefined();
    expect(metrics.dismissedAlerts).toBeDefined();
    expect(Array.isArray(metrics.dismissedAlerts)).toBe(true);

    // At least one rule should be flagged as a guideline gap based on seeded telemetry
    const flaggedRules = metrics.dismissedAlerts.filter((r) => r.flagged);
    expect(flaggedRules.length).toBeGreaterThanOrEqual(1);

    // Verify all flagged rules have >= 40% dismissal rate
    for (const rule of flaggedRules) {
      expect(rule.dismissalRatePct).toBeGreaterThanOrEqual(40);
      expect(rule.exampleSnippet).toBeTruthy();
      expect(rule.suggestedAction).toBeTruthy();
      expect(rule.isSeeded).toBe(true);
    }
  });

  it('unit test: verifies threshold logic (39% no, 40% yes, 4 decisions no)', () => {

    // Threshold is >= 40% AND at least 5 decisions
    expect(shouldFlagGuidelineGap(1, 4)).toBe(false); // 25%, count < 5
    expect(shouldFlagGuidelineGap(2, 4)).toBe(false); // 50%, count < 5 (fails count >= 5)
    expect(shouldFlagGuidelineGap(4, 4)).toBe(false); // 100%, count < 5
    expect(shouldFlagGuidelineGap(39, 100)).toBe(false); // 39% (fails rate >= 40%)
    expect(shouldFlagGuidelineGap(2, 5)).toBe(true); // 40%, count = 5 (passes)
    expect(shouldFlagGuidelineGap(41, 100)).toBe(true); // 41%, count = 100 (passes)
  });

  it('correctly calculates totalCount, dismissedCount, and dismissalRatePct', async () => {
    const metrics = await getInsightsMetrics(SEED_WORKSPACE_ID);
    for (const alert of metrics.dismissedAlerts) {
      expect(alert.totalCount).toBeGreaterThanOrEqual(5);
      const computedRate = Math.round((alert.dismissedCount / alert.totalCount) * 100);
      expect(alert.dismissalRatePct).toBe(computedRate);
    }
  });
});
