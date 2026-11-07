import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredIdempotencyKeys } from '@/lib/optimistic/idempotency';

export async function GET(req: NextRequest) {
  // Check authorization header if CRON_SECRET is configured
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deletedCount = await cleanupExpiredIdempotencyKeys();
  return NextResponse.json({
    ok: true,
    deletedCount,
    cleanedAt: new Date().toISOString(),
  });
}

