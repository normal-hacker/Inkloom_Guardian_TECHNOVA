import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { serverEnv } from '@/lib/env';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { SEED_WORKSPACE_ID } from '@/lib/db/seed';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { sanitizeNextUrl } from '@/lib/auth/client';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value;
  const codeVerifier = cookieStore.get('google_code_verifier')?.value;

  const failureRedirect = (reason: string) => {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', reason);
    return NextResponse.redirect(loginUrl);
  };

  if (errorParam) {
    return failureRedirect(errorParam === 'access_denied' ? 'google_denied' : 'google_failed');
  }

  if (!state || !storedState || state !== storedState || !code || !codeVerifier) {
    return failureRedirect('google_state_mismatch');
  }

  try {
    const redirectUri = `${serverEnv.authBaseUrl}/api/v1/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: serverEnv.googleClientId,
        client_secret: serverEnv.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      return failureRedirect('google_token_exchange_failed');
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;
    if (!idToken) {
      return failureRedirect('google_missing_id_token');
    }

    // Decode ID Token JWT payload
    const [, payloadPart] = idToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));

    if (payload.aud !== serverEnv.googleClientId || !payload.email_verified || !payload.email) {
      return failureRedirect('google_unverified_account');
    }

    const email = payload.email.toLowerCase();
    const displayName = payload.name || email.split('@')[0];

    // Find or create user with role 'creator' only
    let [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      const [newUser] = await db
        .insert(schema.users)
        .values({
          workspaceId: SEED_WORKSPACE_ID,
          email,
          displayName,
          role: 'creator', // Strictly creator role by default
          isDemo: false,
        })
        .returning();
      user = newUser;
    }

    // Create session token (8 hours for standard sign-ins)
    const sessionToken = createSessionToken(
      {
        sub: user.id,
        wid: user.workspaceId,
        role: user.role as 'creator' | 'reviewer' | 'manager',
        isDemo: user.isDemo,
        displayName: user.displayName,
        email: user.email,
      },
      8 * 60 * 60
    );

    // Record audit log
    await db.insert(schema.auditLog).values({
      workspaceId: user.workspaceId,
      actorId: user.id,
      action: 'auth.google.success',
      detail: { email: user.email },
    });

    const nextUrl = sanitizeNextUrl(url.searchParams.get('next'));
    const response = NextResponse.redirect(new URL(nextUrl, req.url));

    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 8 * 60 * 60,
      path: '/',
    });

    // Clear one-time oauth cookies
    response.cookies.delete('google_oauth_state');
    response.cookies.delete('google_code_verifier');

    return response;
  } catch {
    return failureRedirect('google_failed');
  }
}
