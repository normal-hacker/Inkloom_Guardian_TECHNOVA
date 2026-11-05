import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/lib/auth/guards';
import { getDraftGuidelines, activateDraftRuleSet, GuidelinesError } from '@/lib/services/guidelines';

export async function POST(req: NextRequest) {
  try {
    const session = requireAuth(req);
    requireRole(['manager'], session);

    const draft = await getDraftGuidelines(session.wid);
    if (!draft) {
      return NextResponse.json({ error: 'no_draft', message: 'No draft rule set to activate.' }, { status: 404 });
    }

    const result = await activateDraftRuleSet(draft.ruleSet.id, session.wid, session.sub);
    return NextResponse.json(result);
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
