// DOMAIN DERIVATIONS — single source of truth for business logic derivations
// Implemented from docs/DOMAIN.md §4

import {
  ReviewRun,
  FindingView,
  User,
  ContentItem,
  ContentVersion,
} from './types';

/**
 * isCleared(run)
 * ALWAYS false when run.status !== "complete".
 * Even when complete it means only "checks found nothing", never "approved".
 * UI wording: "No issues found by the checks that ran. A human reviewer still decides."
 */
export function isCleared(run: ReviewRun | null | undefined): boolean {
  if (!run) return false;
  return run.status === 'complete' && Object.values(run.counts).every((c) => c === 0);
}

/**
 * openBlockers(findings)
 * Findings with severity === "blocker" && status === "open".
 */
export function openBlockers(findings: FindingView[]): FindingView[] {
  return findings.filter((f) => f.severity === 'blocker' && f.status === 'open');
}

export interface CanApproveParams {
  user: Pick<User, 'id' | 'role'>;
  item: Pick<ContentItem, 'owner_id' | 'current_version_id'>;
  version: Pick<ContentVersion, 'id'>;
  run: Pick<ReviewRun, 'content_version_id' | 'status' | 'ai'> | null;
  findings: FindingView[];
}

export interface CanApproveResult {
  allowed: boolean;
  reason?: string;
}

/**
 * canApprove({ user, item, version, run, findings })
 * - role is reviewer/manager
 * - user != item owner
 * - run.content_version_id === item.current_version_id
 * - run.status is complete or rules_only_ai_failed
 * - no open blockers
 */
export function canApprove({
  user,
  item,
  version,
  run,
  findings,
}: CanApproveParams): CanApproveResult {
  if (user.role !== 'reviewer' && user.role !== 'manager') {
    return {
      allowed: false,
      reason: 'Only reviewers and managers can approve content.',
    };
  }

  if (user.id === item.owner_id) {
    return {
      allowed: false,
      reason: 'Authors cannot approve their own content.',
    };
  }

  if (!run) {
    return {
      allowed: false,
      reason: 'A check run is required before approving.',
    };
  }

  if (run.content_version_id !== item.current_version_id) {
    return {
      allowed: false,
      reason: 'The check run does not match the current version.',
    };
  }

  if (version.id !== item.current_version_id) {
    return {
      allowed: false,
      reason: 'You must view and approve the current version.',
    };
  }

  if (run.status !== 'complete' && run.status !== 'rules_only_ai_failed') {
    return {
      allowed: false,
      reason: `Check run status is ${run.status}. A successful run is required.`,
    };
  }

  const blockers = openBlockers(findings);
  if (blockers.length > 0) {
    return {
      allowed: false,
      reason: `Cannot approve: ${blockers.length} open blocker finding(s) must be resolved or dismissed first.`,
    };
  }

  return { allowed: true };
}

/**
 * needsRecheck(item, version, run)
 * True if the current version has no run or run version mismatch.
 */
export function needsRecheck(
  item: Pick<ContentItem, 'current_version_id'>,
  version: Pick<ContentVersion, 'id'>,
  run: Pick<ReviewRun, 'content_version_id' | 'status'> | null
): boolean {
  if (!run) return true;
  if (run.content_version_id !== item.current_version_id) return true;
  if (version.id !== item.current_version_id) return true;
  return run.status === 'running' || run.status === 'error';
}

