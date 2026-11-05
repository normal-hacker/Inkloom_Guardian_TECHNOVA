/**
 * Client-side authentication helpers & URL safety validators.
 */

export interface SafeRedirectResult {
  url: string;
  isValid: boolean;
}

/**
 * Validates and sanitizes the "next" redirect query parameter.
 * Strictly prevents open redirect attacks by accepting ONLY relative paths
 * that begin with a single "/" and do NOT begin with "//", "/\", or absolute protocols.
 */
export function sanitizeNextUrl(rawNext: string | null | undefined, fallback: string = '/dashboard'): string {
  if (!rawNext || typeof rawNext !== 'string') {
    return fallback;
  }

  const trimmed = rawNext.trim();

  // Must begin with a single slash
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // Reject protocol-relative URLs like "//evil.com"
  if (trimmed.startsWith('//')) {
    return fallback;
  }

  // Reject backslash tricks like "/\evil.com" or "/\\evil.com"
  if (trimmed.startsWith('/\\') || trimmed.includes('\\')) {
    return fallback;
  }

  // Reject embedded protocols like "/http://evil.com"
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

export async function fetchProviders() {
  const res = await fetch('/api/v1/auth/providers');
  if (!res.ok) {
    throw new Error('Failed to load auth providers');
  }
  return res.json();
}

export async function loginAsDemo(userId: string, role?: string) {
  const res = await fetch('/api/v1/auth/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      status: res.status,
      message: data.message || 'Demo login failed',
      retryAfter: res.status === 429 ? 60 : undefined,
    };
  }
  return data;
}

export async function loginWithPassword(email: string, pass: string) {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      status: res.status,
      message: data.message || 'Email or password is incorrect.',
      retryAfter: data.retryAfter || (res.status === 429 ? 60 : undefined),
    };
  }
  return data;
}

export async function logoutUser() {
  const res = await fetch('/api/v1/auth/logout', { method: 'POST' });
  return res.ok;
}
