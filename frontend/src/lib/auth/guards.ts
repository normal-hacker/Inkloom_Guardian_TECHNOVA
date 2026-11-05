import { SessionData, getSessionFromRequest } from './session';

export type UserRole = 'creator' | 'reviewer' | 'manager';

export class AuthError extends Error {
  constructor(
    public status: number,
    public code: 'unauthenticated' | 'forbidden' | 'not_found',
    message: string,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extracts and verifies the session from the incoming Request.
 * Throws AuthError(401) if invalid or missing.
 */
export function requireAuth(req: Request): SessionData {
  const session = getSessionFromRequest(req);
  if (!session) {
    throw new AuthError(401, 'unauthenticated', 'Authentication required. Please sign in or use demo login.');
  }
  return session;
}

/**
 * Ensures the session user has one of the allowed roles.
 * Throws AuthError(403) if insufficient role.
 */
export function requireRole(allowedRoles: UserRole[], session: SessionData): void {
  if (!allowedRoles.includes(session.role)) {
    throw new AuthError(
      403,
      'forbidden',
      `Insufficient permissions. Role "${session.role}" cannot perform this action.`,
      { required_roles: allowedRoles, current_role: session.role }
    );
  }
}

/**
 * Object-level permission check:
 * - Different workspace -> 404 (do not leak existence)
 * - Creator accessing another user's content -> 404 (do not leak existence)
 */
export function assertContentAccess(
  session: SessionData,
  item: { workspaceId: string; ownerId: string }
): void {
  if (item.workspaceId !== session.wid) {
    throw new AuthError(404, 'not_found', 'Content item not found.');
  }

  if (session.role === 'creator' && item.ownerId !== session.sub) {
    throw new AuthError(404, 'not_found', 'Content item not found.');
  }
}

/**
 * Prevents a user from approving their own content item (separation of duties).
 * Throws AuthError(403) if creator is same as decider.
 */
export function assertCanApprove(session: SessionData, contentOwnerId: string): void {
  requireRole(['reviewer', 'manager'], session);

  if (session.sub === contentOwnerId) {
    throw new AuthError(
      403,
      'forbidden',
      'Self-approval is forbidden. Another reviewer or manager must approve your content.',
      { rule: 'separation_of_duties' }
    );
  }
}

/**
 * Dismissing/overriding a blocker requires:
 * 1. Role reviewer or manager (creators cannot dismiss blockers)
 * 2. Non-empty reason of at least 10 characters
 */
export function assertCanDismissFinding(
  session: SessionData,
  findingSeverity: string,
  reason?: string
): void {
  if (findingSeverity === 'blocker') {
    requireRole(['reviewer', 'manager'], session);

    if (!reason || reason.trim().length < 10) {
      throw new AuthError(
        403,
        'forbidden',
        'Dismissing or overriding a blocker finding requires a reason of at least 10 characters.'
      );
    }
  }
}
