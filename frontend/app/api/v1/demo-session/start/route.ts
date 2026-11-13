import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_EXPIRY_SECONDS } from '@/lib/auth/session';
import { SEED_WORKSPACE_ID, SEED_USERS } from '@/lib/db/seed';

export async function POST(req: NextRequest) {
  try {
    const demoSessionId = crypto.randomUUID();
    const draftId = `draft-${demoSessionId.slice(0, 8)}`;

    // Create session token for Asha (Creator)
    const token = createSessionToken({
      sub: SEED_USERS.ASHA,
      wid: SEED_WORKSPACE_ID,
      email: 'asha@brightway.example',
      displayName: 'Asha (Creator)',
      role: 'creator',
      isDemo: true,
    });

    const res = NextResponse.json({
      success: true,
      demoSessionId,
      contentItemId: draftId,
      redirectUrl: `/demo/guided?session=${demoSessionId}&item=${draftId}`,
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_SECONDS,
    });

    res.cookies.set({
      name: 'inkloom_has_session',
      value: '1',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_SECONDS,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'demo_session_creation_failed', message: error?.message || 'Failed to start demo session' } },
      { status: 500 }
    );
  }
}
