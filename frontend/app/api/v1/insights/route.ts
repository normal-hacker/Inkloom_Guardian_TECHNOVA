import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { getInsightsMetrics } from '@/lib/services/insights';

export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);
    const metrics = await getInsightsMetrics(session.wid);
    return NextResponse.json(metrics);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}
