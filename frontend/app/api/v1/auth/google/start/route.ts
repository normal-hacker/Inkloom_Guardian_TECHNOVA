import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { serverEnv } from '@/lib/env';

export async function GET(req: Request) {
  if (!serverEnv.isGoogleAuthEnabled) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'google_not_configured');
    return NextResponse.redirect(loginUrl);
  }

  const state = crypto.randomBytes(24).toString('base64url');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const redirectUri = `${serverEnv.authBaseUrl}/api/v1/auth/google/callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', serverEnv.googleClientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const res = NextResponse.redirect(authUrl);

  // Set short-lived cookies for verification (5 minutes)
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 300,
    path: '/',
  });
  res.cookies.set('google_code_verifier', codeVerifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 300,
    path: '/',
  });

  return res;
}
