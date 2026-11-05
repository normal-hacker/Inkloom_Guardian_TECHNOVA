import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { serverEnv } from '../env';

export const SESSION_COOKIE_NAME = 'inkloom_session';
export const SESSION_EXPIRY_SECONDS = 2 * 60 * 60; // 2 hours for demo sessions

export interface SessionUser {
  id: string;
  workspaceId: string;
  email: string;
  displayName: string;
  role: 'creator' | 'reviewer' | 'manager';
  isDemo: boolean;
}

export interface SessionData {
  sub: string; // userId
  wid: string; // workspaceId
  role: 'creator' | 'reviewer' | 'manager';
  isDemo: boolean;
  displayName: string;
  email: string;
  iat: number;
  exp: number;
}

function getSecretKey(): string {
  const secret = serverEnv.sessionSecret;
  if (!secret || secret.length < 16) {
    // Fallback for development if not provided, but serverEnv handles loading
    return 'inkloom-guardian-default-dev-secret-key-32chars!';
  }
  return secret;
}

export function createSessionToken(
  payload: Omit<SessionData, 'iat' | 'exp'>,
  expiresInSeconds: number = SESSION_EXPIRY_SECONDS
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload: SessionData = { ...payload, iat, exp };

  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecretKey())
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionData | null {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', getSecretKey())
    .update(encodedPayload)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr) as SessionData;

    const now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < now) {
      return null; // Expired
    }

    return data;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function getSessionFromRequest(req: Request): SessionData | null {
  // 1. Try Bearer token in Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifySessionToken(token);
    if (verified) return verified;
  }

  // 2. Try cookie header
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  if (match && match[1]) {
    return verifySessionToken(decodeURIComponent(match[1]));
  }

  return null;
}
