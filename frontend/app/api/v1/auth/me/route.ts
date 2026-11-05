import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { apiError } from '@/lib/api/errors';
import { getSessionFromRequest } from '@/lib/auth/session';

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const session = getSessionFromRequest(req);

  if (!session) {
    return apiError(
      401,
      'unauthenticated',
      'No active session found. Please sign in.',
      requestId
    );
  }

  return NextResponse.json(
    {
      user: {
        id: session.sub,
        workspaceId: session.wid,
        email: session.email,
        displayName: session.displayName,
        role: session.role,
        isDemo: session.isDemo,
      },
    },
    {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    }
  );
}

