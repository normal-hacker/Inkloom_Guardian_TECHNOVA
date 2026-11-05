import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/lib/auth/guards';
import { getDraftGuidelines, updateDraftRule, GuidelinesError } from '@/lib/services/guidelines';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ ruleKey: string }> }
) {
  try {
    const session = requireAuth(req);
    requireRole(['manager'], session);

    const { ruleKey } = await context.params;
    const body = await req.json().catch(() => ({}));

    // Find current draft rule set
    const draft = await getDraftGuidelines(session.wid);
    if (!draft) {
      return NextResponse.json({ error: 'no_draft', message: 'No draft rule set exists.' }, { status: 404 });
    }

    const result = await updateDraftRule({
      draftRuleSetId: draft.ruleSet.id,
      ruleKey,
      updates: body,
    });

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
