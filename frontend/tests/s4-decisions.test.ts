/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { newDb, DataType } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { setCustomPool } from '../src/lib/db/client';
import { seedDatabase, SEED_WORKSPACE_ID, SEED_USERS } from '../src/lib/db/seed';
import {
  recordFindingDecision,
  submitContent,
  recordContentDecision,
  WorkflowError,
} from '../src/lib/services/workflow';
import { addComment, getComments } from '../src/lib/services/comments';
import { getAuditLogs, exportAuditCsv } from '../src/lib/services/audit';
import {
  getActiveGuidelines,
  createDraftRuleSet,
  updateDraftRule,
  activateDraftRuleSet,
  importYamlRules,
  GuidelinesError,
} from '../src/lib/services/guidelines';

describe('Stage S4 — Human Decisions, Comments, Audit & Guidelines', () => {
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

  it('1. Finding decision guards: blocker dismiss/override requires reviewer/manager and >=10 char reason', async () => {
    // Content 1 in seed has a blocker finding for NUM-001
    const [finding] = await drizzleDb
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.severity, 'blocker'))
      .limit(1);

    expect(finding).toBeDefined();

    // A. Reason < 10 chars -> 400 reason_required
    await expect(
      recordFindingDecision({
        findingId: finding.id,
        userId: SEED_USERS.PRIYA,
        userRole: 'reviewer',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'dismissed',
        reason: 'Too short',
      })
    ).rejects.toThrow(WorkflowError);

    try {
      await recordFindingDecision({
        findingId: finding.id,
        userId: SEED_USERS.PRIYA,
        userRole: 'reviewer',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'dismissed',
        reason: 'Too short',
      });
    } catch (err: any) {
      expect(err.status).toBe(400);
      expect(err.code).toBe('reason_required');
    }

    // B. Creator trying to dismiss a blocker finding -> 403 forbidden
    await expect(
      recordFindingDecision({
        findingId: finding.id,
        userId: SEED_USERS.ASHA,
        userRole: 'creator',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'dismissed',
        reason: 'Authorized exception from marketing director',
      })
    ).rejects.toThrow(WorkflowError);

    try {
      await recordFindingDecision({
        findingId: finding.id,
        userId: SEED_USERS.ASHA,
        userRole: 'creator',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'dismissed',
        reason: 'Authorized exception from marketing director',
      });
    } catch (err: any) {
      expect(err.status).toBe(403);
      expect(err.code).toBe('forbidden');
    }

    // C. Reviewer dismissing blocker with valid reason -> succeeds
    const res = await recordFindingDecision({
      findingId: finding.id,
      userId: SEED_USERS.PRIYA,
      userRole: 'reviewer',
      workspaceId: SEED_WORKSPACE_ID,
      decision: 'dismissed',
      reason: 'Authorized exception granted for holiday promotional campaign.',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('dismissed');

    // Verify finding in db
    const [updated] = await drizzleDb
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.id, finding.id));
    expect(updated.status).toBe('dismissed');

    // Reopening sets back to open
    const reopened = await recordFindingDecision({
      findingId: finding.id,
      userId: SEED_USERS.PRIYA,
      userRole: 'reviewer',
      workspaceId: SEED_WORKSPACE_ID,
      decision: 'reopened',
    });
    expect(reopened.status).toBe('open');
  });

  it('2. Content submit requires completed check and is idempotent', async () => {
    // Create new content item without check run
    const itemId = '11111111-2222-3333-4444-555555555555';
    const verId = '11111111-2222-3333-4444-666666666666';

    await drizzleDb.insert(schema.contentItems).values({
      id: itemId,
      workspaceId: SEED_WORKSPACE_ID,
      title: 'Unchecked Blog Post',
      contentType: 'blog',
      status: 'draft',
      ownerId: SEED_USERS.ASHA,
      currentVersionId: verId,
    });

    await drizzleDb.insert(schema.contentVersions).values({
      id: verId,
      contentItemId: itemId,
      versionNo: 1,
      textBody: 'Draft text',
      contentHash: 'hash1',
      createdBy: SEED_USERS.ASHA,
    });

    // Submitting without check run -> 409 stale_check
    await expect(
      submitContent({
        contentItemId: itemId,
        userId: SEED_USERS.ASHA,
        userRole: 'creator',
        workspaceId: SEED_WORKSPACE_ID,
      })
    ).rejects.toThrow(WorkflowError);

    // Add completed review run
    const [activeSet] = await drizzleDb
      .select()
      .from(schema.ruleSets)
      .where(eq(schema.ruleSets.status, 'active'));

    await drizzleDb.insert(schema.reviewRuns).values({
      id: '22222222-3333-4444-5555-666666666666',
      contentVersionId: verId,
      ruleSetId: activeSet.id,
      status: 'complete',
      counts: {},
    });

    // Submit now succeeds
    const subRes = await submitContent({
      contentItemId: itemId,
      userId: SEED_USERS.ASHA,
      userRole: 'creator',
      workspaceId: SEED_WORKSPACE_ID,
    });
    expect(subRes.success).toBe(true);
    expect(subRes.status).toBe('in_review');

    // Double-click safety: submitting again is idempotent
    const subRes2 = await submitContent({
      contentItemId: itemId,
      userId: SEED_USERS.ASHA,
      userRole: 'creator',
      workspaceId: SEED_WORKSPACE_ID,
    });
    expect(subRes2.success).toBe(true);
    expect(subRes2.idempotent).toBe(true);
  });

  it('3. Blocker gate and self-approval prevention on content decision', async () => {
    // Content 2 in seed is 'Installer partnership post', owned by Ben, with open blocker finding
    const [content2] = await drizzleDb
      .select()
      .from(schema.contentItems)
      .where(eq(schema.contentItems.title, 'Installer partnership post'))
      .limit(1);

    expect(content2).toBeDefined();

    // A. Self-approval forbidden: if Reviewer is author -> 403 self_approval_forbidden
    // Let's create an item owned by Reviewer (Priya)
    const reviewerOwnedItemId = '33333333-4444-5555-6666-777777777777';
    const reviewerOwnedVerId = '33333333-4444-5555-6666-888888888888';
    const [activeSet] = await drizzleDb
      .select()
      .from(schema.ruleSets)
      .where(eq(schema.ruleSets.status, 'active'));

    await drizzleDb.insert(schema.contentItems).values({
      id: reviewerOwnedItemId,
      workspaceId: SEED_WORKSPACE_ID,
      title: 'Reviewers Own Draft',
      contentType: 'web',
      status: 'in_review',
      ownerId: SEED_USERS.PRIYA,
      currentVersionId: reviewerOwnedVerId,
    });
    await drizzleDb.insert(schema.contentVersions).values({
      id: reviewerOwnedVerId,
      contentItemId: reviewerOwnedItemId,
      versionNo: 1,
      textBody: 'Some copy',
      contentHash: 'hash_reviewer',
      createdBy: SEED_USERS.PRIYA,
    });
    await drizzleDb.insert(schema.reviewRuns).values({
      id: '44444444-5555-6666-7777-888888888888',
      contentVersionId: reviewerOwnedVerId,
      ruleSetId: activeSet.id,
      status: 'complete',
      counts: {},
    });

    try {
      await recordContentDecision({
        contentItemId: reviewerOwnedItemId,
        userId: SEED_USERS.PRIYA, // Same as owner!
        userRole: 'reviewer',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'approved',
      });
      expect.fail('Should have failed self-approval');
    } catch (err: any) {
      expect(err.status).toBe(403);
      expect(err.code).toBe('self_approval_forbidden');
    }

    // B. Blocker Gate: Reviewer tries to approve Content 2 (has open blocker) -> 409 approval_blocked
    try {
      await recordContentDecision({
        contentItemId: content2.id,
        userId: SEED_USERS.PRIYA,
        userRole: 'reviewer',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'approved',
      });
      expect.fail('Should have failed due to open blocker');
    } catch (err: any) {
      expect(err.status).toBe(409);
      expect(err.code).toBe('approval_blocked');
    }

    // Dismiss the blocker finding
    const blockers = await drizzleDb
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.severity, 'blocker'));

    for (const b of blockers) {
      await recordFindingDecision({
        findingId: b.id,
        userId: SEED_USERS.PRIYA,
        userRole: 'reviewer',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'dismissed',
        reason: 'Promotion verified by VP of Marketing.',
      });
    }

    // C. Approval now succeeds!
    const approvalRes = await recordContentDecision({
      contentItemId: content2.id,
      userId: SEED_USERS.PRIYA,
      userRole: 'reviewer',
      workspaceId: SEED_WORKSPACE_ID,
      decision: 'approved',
      notes: 'All items resolved or verified.',
    });

    expect(approvalRes.success).toBe(true);
    expect(approvalRes.decision).toBe('approved');

    // D. Double-click safety: calling approve again returns idempotent result (no duplicate approvals)
    const approvalRes2 = await recordContentDecision({
      contentItemId: content2.id,
      userId: SEED_USERS.PRIYA,
      userRole: 'reviewer',
      workspaceId: SEED_WORKSPACE_ID,
      decision: 'approved',
    });
    expect(approvalRes2.idempotent).toBe(true);

    const storedApprovals = await drizzleDb
      .select()
      .from(schema.approvals)
      .where(eq(schema.approvals.contentVersionId, content2.currentVersionId!));
    expect(storedApprovals.length).toBe(1);
    expect(storedApprovals[0].contentHash).toBeDefined();
    expect(storedApprovals[0].ruleSetId).toBe(activeSet.id);
  });

  it('4. Request changes & reject require note (>= 10 chars)', async () => {
    const [content2] = await drizzleDb
      .select()
      .from(schema.contentItems)
      .where(eq(schema.contentItems.title, 'Installer partnership post'))
      .limit(1);

    // Reject without note -> 400 note_required
    await expect(
      recordContentDecision({
        contentItemId: content2.id,
        userId: SEED_USERS.PRIYA,
        userRole: 'reviewer',
        workspaceId: SEED_WORKSPACE_ID,
        decision: 'changes_requested',
        notes: 'Fix it', // < 10 chars
      })
    ).rejects.toThrow(WorkflowError);

    const res = await recordContentDecision({
      contentItemId: content2.id,
      userId: SEED_USERS.PRIYA,
      userRole: 'reviewer',
      workspaceId: SEED_WORKSPACE_ID,
      decision: 'changes_requested',
      notes: 'Please update the savings claim to match the 2025 facts sheet.',
    });

    expect(res.success).toBe(true);
    expect(res.decision).toBe('changes_requested');
  });

  it('5. Comments CRUD anchored to content and audit trail', async () => {
    const [content1] = await drizzleDb
      .select()
      .from(schema.contentItems)
      .limit(1);

    const c = await addComment({
      contentItemId: content1.id,
      contentVersionId: content1.currentVersionId || undefined,
      authorId: SEED_USERS.PRIYA,
      workspaceId: SEED_WORKSPACE_ID,
      body: 'Please double-check the warranty clause.',
    });

    expect(c.id).toBeDefined();
    expect(c.body).toBe('Please double-check the warranty clause.');

    const comments = await getComments(content1.id, SEED_WORKSPACE_ID);
    expect(comments.length).toBeGreaterThan(0);
    expect(comments[0].authorEmail).toBe('priya@brightway.example');
    expect(comments[0].body).toBe('Please double-check the warranty clause.');
  });

  it('6. Audit log querying and CSV export (Manager only)', async () => {
    const logs = await getAuditLogs({
      workspaceId: SEED_WORKSPACE_ID,
      limit: 10,
    });

    expect(logs.items.length).toBeGreaterThan(0);
    expect(logs.total).toBeGreaterThan(0);

    const csv = await exportAuditCsv(SEED_WORKSPACE_ID);
    expect(csv).toContain('id,timestamp,action,actor_email,actor_role,entity_type,entity_id,content_hash,rule_set_id,detail');
    expect(csv.split('\n').length).toBeGreaterThan(1);
  });

  it('7. Guidelines management: activating draft v4 leaves old runs citing v3', async () => {
    // 1. Get active guidelines
    const active = await getActiveGuidelines(SEED_WORKSPACE_ID);
    expect(active).not.toBeNull();
    const v3Id = active!.ruleSet.id;
    expect(active!.ruleSet.version).toBe(3);

    // 2. Create draft rule set v4
    const draft = await createDraftRuleSet(SEED_WORKSPACE_ID, SEED_USERS.MARCUS);
    expect(draft!.ruleSet.version).toBe(4);
    expect(draft!.ruleSet.status).toBe('draft');
    expect(draft!.rules.length).toBe(active!.rules.length);

    // 3. Update rule in draft
    await updateDraftRule({
      draftRuleSetId: draft!.ruleSet.id,
      ruleKey: 'CLAIM-001',
      updates: {
        severity: 'major',
        explanation: 'Updated explanation in v4 draft.',
      },
    });

    // 4. Activate draft v4
    const actRes = await activateDraftRuleSet(
      draft!.ruleSet.id,
      SEED_WORKSPACE_ID,
      SEED_USERS.MARCUS
    );
    expect(actRes.success).toBe(true);
    expect(actRes.version).toBe(4);

    // 5. Old runs still cite v3
    const [historicalRun] = await drizzleDb
      .select()
      .from(schema.reviewRuns)
      .limit(1);
    expect(historicalRun.ruleSetId).toBe(v3Id);
  });

  it('8. YAML import validation reports line-numbered errors', async () => {
    // Invalid YAML syntax (unbalanced braces/quotes)
    const brokenYaml = `
rules:
  - key: TONE-099
    category: tone
    severity: [unclosed list
    title: Broken
`;

    await expect(
      importYamlRules(SEED_WORKSPACE_ID, SEED_USERS.MARCUS, brokenYaml)
    ).rejects.toThrow(GuidelinesError);

    try {
      await importYamlRules(SEED_WORKSPACE_ID, SEED_USERS.MARCUS, brokenYaml);
    } catch (err: any) {
      expect(err.status).toBe(400);
      expect(err.code).toBe('yaml_syntax_error');
      expect(err.message).toContain('line');
    }

    // Invalid schema category
    const badCategoryYaml = `
rules:
  - key: TONE-099
    category: INVALID_CATEGORY
    severity: major
    title: Bad Category
    explanation: This category is invalid.
`;

    try {
      await importYamlRules(SEED_WORKSPACE_ID, SEED_USERS.MARCUS, badCategoryYaml);
    } catch (err: any) {
      expect(err.status).toBe(400);
      expect(err.code).toBe('invalid_category');
    }
  });
});
