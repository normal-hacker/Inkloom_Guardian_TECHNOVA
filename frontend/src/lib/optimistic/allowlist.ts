/**
 * Optimistic UI Allowlist & Classification Matrix
 * Single source of truth for mutation classification across Inkloom Guardian.
 *
 * Principle:
 * - Optimistic: low-risk, reversible, predictable, NOT a governance decision,
 *   doesn't depend on server-generated evidence (hashes, version numbers, audit rows, gate results).
 * - Pending-only: instant feedback with loading/disabled state, final state only after server confirmation.
 * - Local-only: UI navigation/tabs without network mutations.
 */

export type MutationActionClass = 'optimistic' | 'pending_only' | 'local_only' | 'deferred';

export interface MutationActionDefinition {
  action: string;
  file: string;
  endpoint: string;
  role: 'creator' | 'reviewer' | 'manager' | 'any' | 'public' | 'author';
  currentLoading: string;
  classification: MutationActionClass;
  reason: string;
}

export const MUTATION_ALLOWLIST: readonly MutationActionDefinition[] = [
  {
    action: 'comment.add',
    file: 'app/content/[id]/page.tsx',
    endpoint: 'POST /api/v1/content/[id]/comments',
    role: 'any',
    currentLoading: 'Re-fetch on settle',
    classification: 'optimistic',
    reason: 'Low-risk, reversible, result predictable, author intent preserved.',
  },
  {
    action: 'comment.delete',
    file: 'app/content/[id]/page.tsx',
    endpoint: 'DELETE /api/v1/content/[id]/comments/[commentId]',
    role: 'author',
    currentLoading: 'Re-fetch on settle',
    classification: 'optimistic',
    reason: 'Low-risk, reversible, author only.',
  },
  {
    action: 'comment.edit',
    file: 'app/content/[id]/page.tsx',
    endpoint: 'PATCH /api/v1/content/[id]/comments/[commentId]',
    role: 'author',
    currentLoading: 'Re-fetch on settle',
    classification: 'optimistic',
    reason: 'Low-risk, reversible, update text instantly.',
  },
  {
    action: 'guidelines.draft_rule_toggle',
    file: 'app/guidelines/page.tsx',
    endpoint: 'PUT /api/v1/guidelines/draft/rules/[ruleKey]',
    role: 'manager',
    currentLoading: 'None',
    classification: 'optimistic',
    reason: 'Reversible, draft only (not published or cited in runs yet).',
  },
  {
    action: 'guidelines.draft_rule_severity',
    file: 'app/guidelines/page.tsx',
    endpoint: 'PUT /api/v1/guidelines/draft/rules/[ruleKey]',
    role: 'manager',
    currentLoading: 'None',
    classification: 'optimistic',
    reason: 'Reversible, draft only (staged for next version).',
  },
  {
    action: 'guidelines.term.add',
    file: 'app/guidelines/page.tsx',
    endpoint: 'POST /api/v1/guidelines/draft/terms',
    role: 'manager',
    currentLoading: 'Deferred',
    classification: 'deferred',
    reason: 'Deferred: Term staging handled via active guidelines and YAML batch importer.',
  },
  {
    action: 'guidelines.term.delete',
    file: 'app/guidelines/page.tsx',
    endpoint: 'DELETE /api/v1/guidelines/draft/terms/[id]',
    role: 'manager',
    currentLoading: 'Deferred',
    classification: 'deferred',
    reason: 'Deferred: Term staging handled via active guidelines and YAML batch importer.',
  },
  {
    action: 'guidelines.fact.add',
    file: 'app/guidelines/page.tsx',
    endpoint: 'POST /api/v1/guidelines/draft/facts',
    role: 'manager',
    currentLoading: 'Deferred',
    classification: 'deferred',
    reason: 'Deferred: Fact staging handled via active metrics sheet and YAML batch importer.',
  },
  {
    action: 'guidelines.fact.delete',
    file: 'app/guidelines/page.tsx',
    endpoint: 'DELETE /api/v1/guidelines/draft/facts/[id]',
    role: 'manager',
    currentLoading: 'Deferred',
    classification: 'deferred',
    reason: 'Deferred: Fact staging handled via active metrics sheet and YAML batch importer.',
  },
  {
    action: 'auth.login',
    file: 'app/login/page.tsx',
    endpoint: 'POST /api/v1/auth/login',
    role: 'public',
    currentLoading: 'Button spinner',
    classification: 'pending_only',
    reason: 'Authentication: server creates signed JWT and session cookie.',
  },
  {
    action: 'auth.demo_login',
    file: 'app/login/page.tsx, components/layout/AppSidebar.tsx',
    endpoint: 'POST /api/v1/auth/demo-login',
    role: 'public',
    currentLoading: 'Button spinner',
    classification: 'pending_only',
    reason: 'Authentication: switches user context and sets session token.',
  },
  {
    action: 'auth.logout',
    file: 'components/layout/AppSidebar.tsx',
    endpoint: 'POST /api/v1/auth/logout',
    role: 'any',
    currentLoading: 'Redirecting',
    classification: 'pending_only',
    reason: 'Session teardown on server.',
  },
  {
    action: 'content.create',
    file: 'app/content/new/page.tsx',
    endpoint: 'POST /api/v1/content',
    role: 'any',
    currentLoading: 'Submitting',
    classification: 'pending_only',
    reason: 'Server generates UUIDs, SHA-256 hashes, and version 1 record.',
  },
  {
    action: 'content.upload',
    file: 'app/content/new/page.tsx',
    endpoint: 'POST /api/v1/content/upload',
    role: 'any',
    currentLoading: 'Uploading',
    classification: 'pending_only',
    reason: 'Server extracts text from multipart binaries (.docx, .pdf, .txt).',
  },
  {
    action: 'review.check',
    file: 'app/content/[id]/page.tsx',
    endpoint: 'POST /api/v1/content/[id]/check',
    role: 'any',
    currentLoading: 'Polling 2s',
    classification: 'pending_only',
    reason: 'Async review run with deterministic engine and optional AI provider.',
  },
  {
    action: 'content.apply_suggestion',
    file: 'app/content/[id]/page.tsx',
    endpoint: 'POST /api/v1/content/[id]/apply-suggestion',
    role: 'any',
    currentLoading: 'Applying',
    classification: 'pending_only',
    reason: 'Server creates next content version with cryptographic hash.',
  },
  {
    action: 'finding.decision',
    file: 'app/content/[id]/page.tsx',
    endpoint: 'POST /api/v1/findings/[id]/decision',
    role: 'reviewer',
    currentLoading: 'Submitting',
    classification: 'pending_only',
    reason: 'Affects blocker gate, requires justification, immutable audit row.',
  },
  {
    action: 'content.submit_review',
    file: 'app/content/[id]/page.tsx',
    endpoint: 'POST /api/v1/content/[id]/submit',
    role: 'creator',
    currentLoading: 'Submitting',
    classification: 'pending_only',
    reason: 'State machine transition verified against check completion.',
  },
  {
    action: 'content.decision',
    file: 'app/content/[id]/page.tsx',
    endpoint: 'POST /api/v1/content/[id]/decision',
    role: 'reviewer',
    currentLoading: 'Submitting',
    classification: 'pending_only',
    reason: 'Human governance approval gate: blocker check, self-approval check, cryptographic audit.',
  },
  {
    action: 'guidelines.create_draft',
    file: 'app/guidelines/page.tsx',
    endpoint: 'POST /api/v1/guidelines/draft',
    role: 'manager',
    currentLoading: 'Submitting',
    classification: 'pending_only',
    reason: 'Server creates next version container and clones active rule definitions.',
  },
  {
    action: 'guidelines.activate_draft',
    file: 'app/guidelines/page.tsx',
    endpoint: 'POST /api/v1/guidelines/draft/activate',
    role: 'manager',
    currentLoading: 'Modal submitting',
    classification: 'pending_only',
    reason: 'Irreversible governance publication; pins historical runs and activates next version.',
  },
  {
    action: 'guidelines.import_yaml',
    file: 'app/guidelines/page.tsx',
    endpoint: 'POST /api/v1/guidelines/import-yaml',
    role: 'manager',
    currentLoading: 'Parsing',
    classification: 'pending_only',
    reason: 'Server-side syntax parser and validation against brand schema.',
  },
  {
    action: 'ui.tabs_and_filters',
    file: 'app/content/[id]/page.tsx, app/guidelines/page.tsx',
    endpoint: 'None',
    role: 'any',
    currentLoading: 'Instant',
    classification: 'local_only',
    reason: 'Client-side view state; zero server mutation.',
  },
] as const;

export type AllowedOptimisticAction =
  | 'comment.add'
  | 'comment.delete'
  | 'comment.edit'
  | 'guidelines.draft_rule_toggle'
  | 'guidelines.draft_rule_severity';

export function isActionOptimistic(actionName: string): boolean {
  const match = MUTATION_ALLOWLIST.find((m) => m.action === actionName);
  return match?.classification === 'optimistic';
}

export function assertActionOptimistic(actionName: string): void {
  const match = MUTATION_ALLOWLIST.find((m) => m.action === actionName);
  if (!match) {
    throw new Error(
      `[Optimistic UI Security Guard] Unknown mutation action "${actionName}". Must be declared in MUTATION_ALLOWLIST.`
    );
  }
  if (match.classification !== 'optimistic') {
    throw new Error(
      `[Optimistic UI Governance Violation] Action "${actionName}" has classification "${match.classification}". Governance integrity forbids optimistic rendering for this action. Reason: ${match.reason}`
    );
  }
}

