import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireAuth } from '@/lib/auth/guards';
import { apiError } from '@/lib/api/errors';
import { seedDatabase } from '@/lib/db/seed';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = requireAuth(req);
  } catch (err: any) {
    return apiError(err.status || 401, err.code || 'unauthenticated', err.message, requestId);
  }

  if (!session.isDemo) {
    return apiError(
      403,
      'forbidden',
      'Reset demo data is only available in demo persona sessions.',
      requestId
    );
  }

  try {
    await seedDatabase();

    // Log the reset action into audit log
    try {
      await db.insert(schema.auditLog).values({
        workspaceId: session.wid,
        actorId: session.sub,
        action: 'demo.reset',
        entityType: 'workspace',
        entityId: session.wid,
        detail: {
          note: 'Judge initiated demo dataset reset',
          actorName: session.displayName,
          actorRole: session.role,
        },
        createdAt: new Date(),
      });
    } catch (auditErr: any) {
      console.warn('[reset-demo] Audit log warning:', auditErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Demo dataset has been reset to the initial state.',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { 'X-Request-ID': requestId },
      }
    );
  } catch (err: any) {
    console.error('[reset-demo] Error resetting demo data:', err);
    return apiError(
      500,
      'internal_error',
      err.message || 'Failed to reset demo dataset.',
      requestId
    );
  }
}
