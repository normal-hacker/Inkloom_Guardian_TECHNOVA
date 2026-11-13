/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { newDb, DataType } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { setCustomPool } from '../src/lib/db/client';
import { seedDatabase, SEED_WORKSPACE_ID, SEED_USERS } from '../src/lib/db/seed';
import { recordContentDecision, WorkflowError } from '../src/lib/services/workflow';

describe('1.8 Adversarial Demo: Try to Cheat Enforcement Suite', () => {
  let db: any;

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
    setCustomPool(pool);
    db = drizzle(pool, { schema });

    const migrationPath = path.resolve(__dirname, '../drizzle/0000_dark_the_leader.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    memDb.public.none(sql);

    await seedDatabase(db);
  });

  it('1.8: Attempt to self-approve a draft as author (Ben) throws 403 and writes refusal audit log', async () => {
    // Content 2 (or a draft owned by Ben)
    // Find an item owned by Ben
    const benItems = await db
      .select()
      .from(schema.contentItems)
      .where(and(eq(schema.contentItems.workspaceId, SEED_WORKSPACE_ID), eq(schema.contentItems.ownerId, SEED_USERS.BEN)));

    expect(benItems.length).toBeGreaterThan(0);
    const benItem = benItems[0];

    // Attempt to self-approve as Ben (role creator)
    let caughtError: WorkflowError | null = null;
    try {
      await recordContentDecision({
        contentItemId: benItem.id,
        userId: SEED_USERS.BEN,
        userRole: 'creator',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'approved',
      });
    } catch (err) {
      if (err instanceof WorkflowError) {
        caughtError = err;
      }
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.status).toBe(403);

    // Verify audit log row was written with content.approval_refused
    const refusalAuditRows = await db
      .select()
      .from(schema.auditLog)
      .where(
        and(
          eq(schema.auditLog.workspaceId, SEED_WORKSPACE_ID),
          eq(schema.auditLog.action, 'content.approval_refused'),
          eq(schema.auditLog.entityId, benItem.id)
        )
      );

    expect(refusalAuditRows.length).toBeGreaterThan(0);
    expect(refusalAuditRows[0].actorId).toBe(SEED_USERS.BEN);
    expect(refusalAuditRows[0].detail.reason).toMatch(/forbidden|self_approval_forbidden/);
  });

  it('1.8: Attempt to approve content with open blockers throws 409 and writes refusal audit log', async () => {
    // Content 2 in seed (owned by Ben) has an open blocker finding
    const content2 = (
      await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.id, '70000000-0000-0000-0000-000000000002'))
    )[0];

    expect(content2).toBeDefined();

    // Reviewer Priya attempts to approve content with open blocker
    let caughtError: WorkflowError | null = null;
    try {
      await recordContentDecision({
        contentItemId: content2.id,
        userId: SEED_USERS.PRIYA,
        userRole: 'reviewer',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'approved',
      });
    } catch (err) {
      if (err instanceof WorkflowError) {
        caughtError = err;
      }
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.status).toBe(409);
    expect(caughtError?.code).toBe('approval_blocked');

    // Verify audit log row was written with content.approval_refused
    const refusalAuditRows = await db
      .select()
      .from(schema.auditLog)
      .where(
        and(
          eq(schema.auditLog.workspaceId, SEED_WORKSPACE_ID),
          eq(schema.auditLog.action, 'content.approval_refused'),
          eq(schema.auditLog.entityId, content2.id)
        )
      );

    expect(refusalAuditRows.length).toBeGreaterThan(0);
    expect(refusalAuditRows[0].actorId).toBe(SEED_USERS.PRIYA);
    expect(refusalAuditRows[0].detail.reason).toBe('approval_blocked');
  });
});
