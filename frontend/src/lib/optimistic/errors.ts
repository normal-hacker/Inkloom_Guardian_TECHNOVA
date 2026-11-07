/**
 * Standardized Optimistic UI Error Parser & Messaging
 * Implements the error table defined in FRAMEWORK specification §4.
 */

export type OptimisticErrorKind =
  | 'offline'
  | 'timeout'
  | 'unauthenticated' // 401
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'conflict' // 409
  | 'validation' // 422
  | 'rate_limit' // 429
  | 'server_error' // 5xx
  | 'unknown';

export interface OptimisticError {
  kind: OptimisticErrorKind;
  message: string;
  status?: number;
  requestId?: string;
  retryAfterSeconds?: number;
  redirectUrl?: string;
  canRetry: boolean;
  fieldErrors?: Record<string, string>;
}

export function parseHttpError(
  status: number,
  bodyJson?: { error?: string | { code?: string; message?: string; details?: unknown; request_id?: string }; message?: string; request_id?: string; details?: unknown },
  headers?: Headers
): OptimisticError {
  const serverMsg =
    typeof bodyJson?.error === 'object'
      ? bodyJson.error.message
      : bodyJson?.message || (typeof bodyJson?.error === 'string' ? bodyJson.error : undefined);

  const reqId =
    bodyJson?.request_id ||
    (typeof bodyJson?.error === 'object' ? bodyJson.error.request_id : undefined) ||
    headers?.get('x-request-id') ||
    undefined;

  if (status === 401) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
    const safePath = currentPath.startsWith('/') ? currentPath : '/dashboard';
    return {
      kind: 'unauthenticated',
      message: 'Your session expired. Please sign in again.',
      status,
      requestId: reqId,
      redirectUrl: `/login?next=${encodeURIComponent(safePath)}`,
      canRetry: false,
    };
  }

  if (status === 403) {
    return {
      kind: 'forbidden',
      message: serverMsg || "You don't have permission to do this.",
      status,
      requestId: reqId,
      canRetry: false,
    };
  }

  if (status === 404) {
    return {
      kind: 'not_found',
      message: serverMsg || 'That item no longer exists.',
      status,
      requestId: reqId,
      canRetry: false,
    };
  }

  if (status === 409) {
    return {
      kind: 'conflict',
      message: serverMsg || 'This item was updated by someone else. Refreshing to latest state.',
      status,
      requestId: reqId,
      canRetry: false,
    };
  }

  if (status === 422) {
    return {
      kind: 'validation',
      message: serverMsg || 'Validation failed. Please review your input.',
      status,
      requestId: reqId,
      canRetry: true,
      fieldErrors: bodyJson?.details as Record<string, string> | undefined,
    };
  }

  if (status === 429) {
    const retryAfterHeader = headers?.get('retry-after');
    const seconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 10;
    return {
      kind: 'rate_limit',
      message: `Too many requests. Try again in ${isNaN(seconds) ? 10 : seconds} seconds.`,
      status,
      requestId: reqId,
      retryAfterSeconds: isNaN(seconds) ? 10 : seconds,
      canRetry: true,
    };
  }

  if (status >= 500) {
    return {
      kind: 'server_error',
      message: 'Something went wrong on our side. Nothing was changed.',
      status,
      requestId: reqId,
      canRetry: true,
    };
  }

  return {
    kind: 'unknown',
    message: serverMsg || 'An unexpected error occurred. Nothing was changed.',
    status,
    requestId: reqId,
    canRetry: true,
  };
}

export function formatNetworkOrTimeoutError(isTimeout: boolean, isOffline: boolean): OptimisticError {
  if (isOffline) {
    return {
      kind: 'offline',
      message: "You're offline. This wasn't saved.",
      canRetry: true,
    };
  }
  if (isTimeout) {
    return {
      kind: 'timeout',
      message: "Couldn't confirm this was saved. Retry or discard.",
      canRetry: true,
    };
  }
  return {
    kind: 'unknown',
    message: "Network connection lost. Couldn't confirm this was saved. Retry or discard.",
    canRetry: true,
  };
}

