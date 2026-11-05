import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/lib/auth/guards';
import { getDraftGuidelines, createDraftRuleSet, GuidelinesError } from '@/lib/services/guidelines';

export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);
    const result = await getDraftGuidelines(session.wid);
    return NextResponse.json({ draft: result });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireAuth(req);
    requireRole(['manager'], session);

    const result = await createDraftRuleSet(session.wid, session.sub);
    return NextResponse.json({ draft: result }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    if (err instanceof GuidelinesError) {
      return NextResponse.json(
        { error: err.code, message: err.message, details: err.details },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}
