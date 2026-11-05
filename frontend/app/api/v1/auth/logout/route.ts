import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  const requestId = crypto.randomUUID();
  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    }
  );

  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

