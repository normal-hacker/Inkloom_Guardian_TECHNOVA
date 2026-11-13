import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { serverEnv } from '@/lib/env';
import { apiError } from '@/lib/api/errors';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_SECONDS,
  SessionUser,
} from '@/lib/auth/session';
import { SEED_USERS, SEED_WORKSPACE_ID } from '@/lib/db/seed';

const DEMO_USERS_MAP: Record<string, SessionUser> = {
  [SEED_USERS.ASHA]: {
    id: SEED_USERS.ASHA,
    workspaceId: SEED_WORKSPACE_ID,
    email: 'asha@brightway.example',
    displayName: 'Asha (Creator)',
    role: 'creator',
    isDemo: true,
  },
  [SEED_USERS.BEN]: {
    id: SEED_USERS.BEN,
    workspaceId: SEED_WORKSPACE_ID,
    email: 'ben@brightway.example',
    displayName: 'Ben (Creator 2)',
    role: 'creator',
    isDemo: true,
  },
  [SEED_USERS.PRIYA]: {
    id: SEED_USERS.PRIYA,
    workspaceId: SEED_WORKSPACE_ID,
    email: 'priya@brightway.example',
    displayName: 'Priya (Reviewer)',
    role: 'reviewer',
    isDemo: true,
  },
  [SEED_USERS.MARCUS]: {
    id: SEED_USERS.MARCUS,
    workspaceId: SEED_WORKSPACE_ID,
    email: 'marcus@brightway.example',
    displayName: 'Marcus (Manager)',
    role: 'manager',
    isDemo: true,
  },
};

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  // 1. Guard with DEMO_MODE
  if (!serverEnv.isDemoMode) {
    return apiError(
      403,
      'forbidden',
      'Demo mode is disabled on this server.',
      requestId
    );
  }

  // 2. IP Rate Limit (30 requests/hour/IP)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const rateLimit = checkRateLimit(ip, 30, 60 * 60 * 1000);

  if (!rateLimit.allowed) {
    return apiError(
      429,
      'forbidden',
      'Rate limit exceeded. Maximum 30 demo logins per hour.',
      requestId,
      { reset_at: rateLimit.resetAt }
    );
  }

  // 3. Parse requested user or role
  let role = 'creator';
  let userId: string | undefined;

  try {
    const body = await req.json();
    if (body.userId && DEMO_USERS_MAP[body.userId]) {
      userId = body.userId;
    } else if (body.role) {
      role = String(body.role).toLowerCase();
    }
  } catch {
    // Empty body is acceptable; defaults to creator
  }

  let selectedUser: SessionUser;
  if (userId && DEMO_USERS_MAP[userId]) {
    selectedUser = DEMO_USERS_MAP[userId];
  } else if (role === 'manager') {
    selectedUser = DEMO_USERS_MAP[SEED_USERS.MARCUS];
  } else if (role === 'reviewer') {
    selectedUser = DEMO_USERS_MAP[SEED_USERS.PRIYA];
  } else if (role === 'creator-2' || role === 'creator2' || role === 'ben') {
    selectedUser = DEMO_USERS_MAP[SEED_USERS.BEN];
  } else {
    selectedUser = DEMO_USERS_MAP[SEED_USERS.ASHA];
  }

  // 4. Generate signed session token
  const token = createSessionToken({
    sub: selectedUser.id,
    wid: selectedUser.workspaceId,
    role: selectedUser.role,
    isDemo: true,
    displayName: selectedUser.displayName,
    email: selectedUser.email,
  });

  const response = NextResponse.json(
    { user: selectedUser },
    {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    }
  );

  // 5. Set signed, httpOnly session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_SECONDS,
  });

  // Client-readable session flag to avoid unauthenticated 401 polling
  response.cookies.set({
    name: 'inkloom_has_session',
    value: '1',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_SECONDS,
  });

  return response;
}

