import { describe, it, expect, beforeEach } from 'vitest';
import { initMemoryDatabase } from '../src/lib/db/memory-db';
import { setCustomPool } from '../src/lib/db/client';
import { reAuditApprovedContent, resetFactAndReAudit } from '../src/lib/services/guidelines';
import { SEED_WORKSPACE_ID, SEED_USERS, seedDatabase } from '../src/lib/db/seed';
import { db } from '../src/lib/db/client';
import * as schema from '../src/lib/db/schema';
import { eq, and } from 'drizzle-orm';

describe('Round 3 Feature A: Stale-Content Re-Audit Pipeline', () => {
  beforeEach(async () => {
    const { pool, db } = initMemoryDatabase();
    setCustomPool(pool);
    await seedDatabase(db);
  });

  it('detects approved campaigns that violate updated fact ceiling and transitions status to needs_review', async () => {
    // 1. Trigger re-audit with F-001 updated to 15% max savings (item ci-001 claims 20%)
    const result = await reAuditApprovedContent(SEED_WORKSPACE_ID, SEED_USERS.MARCUS, 'F-001', 15);

    expect(result.success).toBe(true);
    expect(result.targetFactKey).toBe('F-001');
    expect(result.newValue).toBe('15%');
    expect(result.flaggedCount).toBeGreaterThanOrEqual(1);

    // 2. Verify approved item transitioned to needs_review
    const items = await db
      .select()
      .from(schema.contentItems)
      .where(and(eq(schema.contentItems.workspaceId, SEED_WORKSPACE_ID), eq(schema.contentItems.id, '70000000-0000-0000-0000-000000000001')));

    expect(items.length).toBe(1);
    expect(items[0].status).toBe('needs_review');

    // 3. Verify audit log recorded both trigger and flagged events
    const auditEntries = await db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.workspaceId, SEED_WORKSPACE_ID));

    const triggerEvent = auditEntries.find((a) => a.action === 'stale_audit.triggered');
    expect(triggerEvent).toBeDefined();

    const flagEvent = auditEntries.find((a) => a.action === 'content.flagged_for_rereview');
    expect(flagEvent).toBeDefined();
    expect((flagEvent?.detail as any)?.previousStatus).toBe('approved');
    expect((flagEvent?.detail as any)?.newStatus).toBe('needs_review');
  });

  it('can reset the fact F-001 and log the audit event', async () => {
    const resetResult = await resetFactAndReAudit(SEED_WORKSPACE_ID, SEED_USERS.MARCUS);
    expect(resetResult.success).toBe(true);

    const auditEntries = await db
      .select()
      .from(schema.auditLog)
      .where(and(eq(schema.auditLog.workspaceId, SEED_WORKSPACE_ID), eq(schema.auditLog.action, 'stale_audit.reset')));

    expect(auditEntries.length).toBeGreaterThanOrEqual(1);
  });
});
