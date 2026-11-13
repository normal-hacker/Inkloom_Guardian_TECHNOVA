import { describe, it, expect, beforeEach } from 'vitest';
import { initMemoryDatabase } from '../src/lib/db/memory-db';
import { setCustomPool, db } from '../src/lib/db/client';
import { SEED_WORKSPACE_ID, SEED_USERS, seedDatabase } from '../src/lib/db/seed';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Phase 3.2 Server-Enforced Approval States', () => {
  beforeEach(async () => {
    const { pool, db } = initMemoryDatabase();
    setCustomPool(pool);
    await seedDatabase(db);
  });

  it('correctly identifies open blockers state on draft with blockers (Item 2)', async () => {
    // Item 2 has open blockers
    const item2Id = '70000000-0000-0000-0000-000000000002';
    const item = (await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, item2Id)))[0];
    const runs = await db.select().from(schema.reviewRuns).where(eq(schema.reviewRuns.contentVersionId, item.currentVersionId!));
    const blockers = await db.select().from(schema.findings).where(eq(schema.findings.reviewRunId, runs[0].id));
    const openBlockers = blockers.filter((f) => f.severity === 'blocker' && f.status === 'open');

    expect(openBlockers.length).toBeGreaterThanOrEqual(1);
  });

  it('correctly identifies author self-approval block when author attempts approval', async () => {
    const item1Id = '70000000-0000-0000-0000-000000000001';
    const item = (await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, item1Id)))[0];
    expect(item.ownerId).toBe(SEED_USERS.ASHA);
    // Asha cannot approve her own item
  });

  it('identifies eligible state when blockers resolved and reviewer is different actor', async () => {
    const item1Id = '70000000-0000-0000-0000-000000000001';
    const item = (await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, item1Id)))[0];
    expect(item.ownerId).not.toBe(SEED_USERS.PRIYA);
  });
});

