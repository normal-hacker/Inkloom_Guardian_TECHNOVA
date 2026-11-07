import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { getActiveGuidelines } from '@/lib/services/guidelines';
import { ensureDatabaseInitialized } from '@/lib/db/init';

export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);
    await ensureDatabaseInitialized();
    const result = await getActiveGuidelines(session.wid);
    if (!result) {
      return NextResponse.json({ error: 'not_found', message: 'No active guidelines found.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const cause = (err as any)?.cause;
    return NextResponse.json(
      {
        error: 'internal_error',
        message,
        details: {
          causeMessage: cause?.message,
          code: cause?.code || (err as any)?.code,
          detail: cause?.detail || (err as any)?.detail,
        },
      },
      { status: 500 }
    );
  }
}
