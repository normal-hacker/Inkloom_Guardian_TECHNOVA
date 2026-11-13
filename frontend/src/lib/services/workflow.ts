import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';

export class WorkflowError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

/**
 * 1. Record decision on a specific finding (fixed, dismissed, overridden, reopened)
 */
export async function recordFindingDecision(params: {
  findingId: string;
  userId: string;
  userRole: 'creator' | 'reviewer' | 'manager';
  workspaceId: string;
  decision: 'fixed' | 'dismissed' | 'overridden' | 'reopened';
  reason?: string;
}) {
  const { findingId, userId, userRole, workspaceId, decision, reason } = params;

  if (decision !== 'reopened' && (!reason || reason.trim().length < 10)) {
    throw new WorkflowError(
      400,
      'reason_required',
      'A reason of at least 10 characters is required to dismiss, override, or mark as fixed.'
    );
  }

  // 1. Fetch finding and ensure existence
  const rows = await db
    .select({
      finding: schema.findings,
      run: schema.reviewRuns,
      version: schema.contentVersions,
      item: schema.contentItems,
    })
    .from(schema.findings)
    .innerJoin(schema.reviewRuns, eq(schema.findings.reviewRunId, schema.reviewRuns.id))
    .innerJoin(schema.contentVersions, eq(schema.reviewRuns.contentVersionId, schema.contentVersions.id))
    .innerJoin(schema.contentItems, eq(schema.contentVersions.contentItemId, schema.contentItems.id))
    .where(eq(schema.findings.id, findingId))
    .limit(1);

  if (!rows.length || rows[0].item.workspaceId !== workspaceId) {
    throw new WorkflowError(404, 'not_found', 'Finding not found.');
  }

  const { finding, version } = rows[0];

  // Blocker gate: only reviewer or manager can dismiss or override a blocker finding
  if (finding.severity === 'blocker' && ['dismissed', 'overridden'].includes(decision)) {
    if (!['reviewer', 'manager'].includes(userRole)) {
      throw new WorkflowError(
        403,
        'forbidden',
        'Only reviewers or managers can dismiss or override blocker findings.',
        { severity: finding.severity, role: userRole }
      );
    }
  }

  const newStatus = decision === 'reopened' ? 'open' : decision;

  // Insert into finding_decisions
  const decisionId = crypto.randomUUID();
  await db.insert(schema.findingDecisions).values({
    id: decisionId,
    findingId,
    decidedBy: userId,
    decision,
    reason: reason?.trim() || null,
  });

  // Update finding status
  await db
    .update(schema.findings)
    .set({ status: newStatus })
    .where(eq(schema.findings.id, findingId));

  // Log audit
  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: userId,
    action: 'finding.decision',
    entityType: 'finding',
    entityId: findingId,
    contentHash: version.contentHash,
    detail: {
      decision,
      newStatus,
      reason: reason?.trim(),
      severity: finding.severity,
      quote: finding.quote,
    },
  });

  return { success: true, decision, findingId, status: newStatus };
}

/**
 * 2. Submit content for review
 */
export async function submitContent(params: {
  contentItemId: string;
  userId: string;
  userRole: 'creator' | 'reviewer' | 'manager';
  workspaceId: string;
}) {
  const { contentItemId, userId, userRole, workspaceId } = params;

  const items = await db
    .select()
    .from(schema.contentItems)
    .where(eq(schema.contentItems.id, contentItemId))
    .limit(1);

  if (!items.length || items[0].workspaceId !== workspaceId) {
    throw new WorkflowError(404, 'not_found', 'Content item not found.');
  }

  const item = items[0];

  if (userRole === 'creator' && item.ownerId !== userId) {
    throw new WorkflowError(404, 'not_found', 'Content item not found.');
  }

  // Double-click safety: if already in_review, return idempotent response
  if (item.status === 'in_review') {
    return { success: true, status: 'in_review', contentItemId, idempotent: true };
  }

  // Must have a completed check run on current version
  if (!item.currentVersionId) {
    throw new WorkflowError(409, 'stale_check', 'Content has no versions to submit.');
  }

  const runs = await db
    .select()
    .from(schema.reviewRuns)
    .where(eq(schema.reviewRuns.contentVersionId, item.currentVersionId))
    .orderBy(desc(schema.reviewRuns.startedAt))
    .limit(1);

  if (!runs.length || !['complete', 'rules_only_ai_failed'].includes(runs[0].status)) {
    throw new WorkflowError(
      409,
      'stale_check',
      'Content must be checked by the engine before submitting for review.'
    );
  }

  // Update status to in_review
  await db
    .update(schema.contentItems)
    .set({
      status: 'in_review',
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId));

  // Log audit
  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: userId,
    action: 'content.submit',
    entityType: 'content_item',
    entityId: contentItemId,
    detail: { versionId: item.currentVersionId, previousStatus: item.status },
  });

  return { success: true, status: 'in_review', contentItemId };
}

/**
 * 3. Human decision on content (approved, changes_requested, rejected)
 */
export async function recordContentDecision(params: {
  contentItemId: string;
  userId: string;
  userRole: 'creator' | 'reviewer' | 'manager';
  workspaceId: string;
  decision: 'approved' | 'changes_requested' | 'rejected';
  notes?: string;
}) {
  const { contentItemId, userId, userRole, workspaceId, decision, notes } = params;

  // Role guard: reviewer or manager only
  if (!['reviewer', 'manager'].includes(userRole)) {
    try {
      await db.insert(schema.auditLog).values({
        workspaceId,
        actorId: userId,
        action: 'content.approval_refused',
        entityType: 'content_item',
        entityId: contentItemId,
        detail: {
          reason: 'role_forbidden',
          userRole,
          attemptedDecision: decision,
          message: `Role "${userRole}" cannot approve or reject content. Reviewer or Manager role required.`,
        },
      });
    } catch {}
    throw new WorkflowError(
      403,
      'forbidden',
      `Role "${userRole}" cannot approve or reject content. Reviewer or Manager role required.`
    );
  }

  const items = await db
    .select()
    .from(schema.contentItems)
    .where(eq(schema.contentItems.id, contentItemId))
    .limit(1);

  if (!items.length || items[0].workspaceId !== workspaceId) {
    throw new WorkflowError(404, 'not_found', 'Content item not found.');
  }

  const item = items[0];

  // Self-approval forbidden: Author cannot approve their own content!
  if (item.ownerId === userId) {
    try {
      await db.insert(schema.auditLog).values({
        workspaceId,
        actorId: userId,
        action: 'content.approval_refused',
        entityType: 'content_item',
        entityId: contentItemId,
        detail: {
          reason: 'self_approval_forbidden',
          ownerId: item.ownerId,
          attemptedDecision: decision,
          message: 'Self-approval is strictly forbidden. A different reviewer must approve or request changes.',
        },
      });
    } catch {}
    throw new WorkflowError(
      403,
      'self_approval_forbidden',
      'Self-approval is strictly forbidden. A different reviewer must approve or request changes.'
    );
  }

  if (!item.currentVersionId) {
    throw new WorkflowError(409, 'stale_check', 'Content has no current version.');
  }

  // Check version and run
  const versions = await db
    .select()
    .from(schema.contentVersions)
    .where(eq(schema.contentVersions.id, item.currentVersionId))
    .limit(1);

  if (!versions.length) {
    throw new WorkflowError(404, 'not_found', 'Current version not found.');
  }

  const version = versions[0];

  const runs = await db
    .select()
    .from(schema.reviewRuns)
    .where(eq(schema.reviewRuns.contentVersionId, item.currentVersionId))
    .orderBy(desc(schema.reviewRuns.startedAt))
    .limit(1);

  if (!runs.length || !['complete', 'rules_only_ai_failed'].includes(runs[0].status)) {
    throw new WorkflowError(
      409,
      'stale_check',
      'Current version has not been checked yet. Please run checks before deciding.'
    );
  }

  const run = runs[0];

  // Blocker gate on approval: Cannot approve if there are open blocker findings
  if (decision === 'approved') {
    const openBlockers = await db
      .select({ id: schema.findings.id, quote: schema.findings.quote })
      .from(schema.findings)
      .where(
        and(
          eq(schema.findings.reviewRunId, run.id),
          eq(schema.findings.severity, 'blocker'),
          eq(schema.findings.status, 'open')
        )
      );

    if (openBlockers.length > 0) {
      try {
        await db.insert(schema.auditLog).values({
          workspaceId,
          actorId: userId,
          action: 'content.approval_refused',
          entityType: 'content_item',
          entityId: contentItemId,
          detail: {
            reason: 'approval_blocked',
            openBlockersCount: openBlockers.length,
            attemptedDecision: decision,
            message: `Approval blocked: ${openBlockers.length} open blocker finding(s) must be resolved, dismissed, or overridden first.`,
          },
        });
      } catch {}
      throw new WorkflowError(
        409,
        'approval_blocked',
        `Approval blocked: ${openBlockers.length} open blocker finding(s) must be resolved, dismissed, or overridden first.`,
        { open_blockers: openBlockers }
      );
    }

    // Double-click safety: Check if approval already recorded for this version
    const existingApprovals = await db
      .select()
      .from(schema.approvals)
      .where(
        and(
          eq(schema.approvals.contentVersionId, item.currentVersionId),
          eq(schema.approvals.decision, 'approved')
        )
      )
      .limit(1);

    if (existingApprovals.length > 0) {
      // Idempotent return: already approved
      return {
        success: true,
        decision: 'approved',
        contentItemId,
        versionId: item.currentVersionId,
        idempotent: true,
      };
    }
  }

  // Note required for changes_requested or rejected
  if (decision !== 'approved' && (!notes || notes.trim().length < 10)) {
    throw new WorkflowError(
      400,
      'note_required',
      'A note of at least 10 characters is required when requesting changes or rejecting content.'
    );
  }

  // Insert approval record
  const approvalId = crypto.randomUUID();
  await db.insert(schema.approvals).values({
    id: approvalId,
    contentVersionId: item.currentVersionId,
    reviewRunId: run.id,
    decision,
    decidedBy: userId,
    note: notes?.trim() || null,
    contentHash: version.contentHash,
    ruleSetId: run.ruleSetId,
  });

  // Update content item status
  await db
    .update(schema.contentItems)
    .set({
      status: decision,
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId));

  // Write audit log
  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: userId,
    action:
      decision === 'approved'
        ? 'content.approve'
        : decision === 'rejected'
          ? 'content.reject'
          : 'content.request_changes',
    entityType: 'content_item',
    entityId: contentItemId,
    contentHash: version.contentHash,
    ruleSetId: run.ruleSetId,
    detail: {
      decision,
      notes: notes?.trim(),
      versionId: item.currentVersionId,
      reviewRunId: run.id,
    },
  });

  return {
    success: true,
    decision,
    contentItemId,
    versionId: item.currentVersionId,
  };
}
