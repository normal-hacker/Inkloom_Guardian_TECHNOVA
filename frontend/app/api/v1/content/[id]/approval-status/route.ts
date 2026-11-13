import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { SEED_WORKSPACE_ID } from '@/lib/db/seed';

export interface ApprovalEligibilityResponse {
  eligible: boolean;
  code: 'eligible' | 'open_blockers' | 'author_is_viewer' | 'check_missing' | 'role_forbidden';
  buttonLabel: string;
  reason: string;
  openBlockerCount: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentItemId } = await params;
    const session = await getSession();
    const workspaceId = session?.wid || SEED_WORKSPACE_ID;
    const userId = session?.sub;
    const userRole = session?.role || 'creator';

    // 1. Fetch content item
    const items = await db
      .select()
      .from(schema.contentItems)
      .where(and(eq(schema.contentItems.id, contentItemId), eq(schema.contentItems.workspaceId, workspaceId)))
      .limit(1);

    if (!items.length) {
      return NextResponse.json(
        { error: { code: 'not_found', message: 'Content item not found.' } },
        { status: 404 }
      );
    }

    const item = items[0];

    // 2. Fetch current version
    if (!item.currentVersionId) {
      return NextResponse.json({
        eligible: false,
        code: 'check_missing',
        buttonLabel: 'Run the current-version check before approval',
        reason: 'Content has no current version.',
        openBlockerCount: 0,
      });
    }

    // 3. Fetch latest review run on current version
    const runs = await db
      .select()
      .from(schema.reviewRuns)
      .where(eq(schema.reviewRuns.contentVersionId, item.currentVersionId))
      .orderBy(desc(schema.reviewRuns.startedAt))
      .limit(1);

    if (!runs.length || !['complete', 'rules_only_ai_failed'].includes(runs[0].status)) {
      return NextResponse.json({
        eligible: false,
        code: 'check_missing',
        buttonLabel: 'Run the current-version check before approval',
        reason: 'Current version has not been checked yet. Please run checks before deciding.',
        openBlockerCount: 0,
      });
    }

    const run = runs[0];

    // 4. Count open blockers
    const openBlockers = await db
      .select({ id: schema.findings.id })
      .from(schema.findings)
      .where(
        and(
          eq(schema.findings.reviewRunId, run.id),
          eq(schema.findings.severity, 'blocker'),
          eq(schema.findings.status, 'open')
        )
      );

    const openBlockerCount = openBlockers.length;

    // 5. Evaluate state hierarchy
    if (openBlockerCount > 0) {
      return NextResponse.json({
        eligible: false,
        code: 'open_blockers',
        buttonLabel: `Approval blocked: ${openBlockerCount} blocker finding${openBlockerCount === 1 ? '' : 's'} open`,
        reason: `Cannot approve content while ${openBlockerCount} blocker finding(s) remain open.`,
        openBlockerCount,
      });
    }

    if (userId && item.ownerId === userId) {
      return NextResponse.json({
        eligible: false,
        code: 'author_is_viewer',
        buttonLabel: 'Approval blocked: authors cannot approve their own draft',
        reason: 'Self-approval is strictly forbidden. A different reviewer must approve.',
        openBlockerCount: 0,
      });
    }

    if (!['reviewer', 'manager'].includes(userRole)) {
      return NextResponse.json({
        eligible: false,
        code: 'role_forbidden',
        buttonLabel: 'Approval blocked: reviewer role required',
        reason: 'Only reviewers and managers can record content decisions.',
        openBlockerCount: 0,
      });
    }

    // All checks pass
    return NextResponse.json({
      eligible: true,
      code: 'eligible',
      buttonLabel: 'Approve content',
      reason: 'All checks passed. Ready for approval.',
      openBlockerCount: 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'server_error', message: error?.message || 'Failed to compute approval status' } },
      { status: 500 }
    );
  }
}

