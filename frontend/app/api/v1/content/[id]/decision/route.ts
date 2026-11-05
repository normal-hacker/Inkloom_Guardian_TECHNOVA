import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { recordContentDecision, WorkflowError } from '@/lib/services/workflow';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await context.params;

    const body = await req.json().catch(() => ({}));
    const { decision, notes } = body;

    if (!['approved', 'changes_requested', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'invalid_decision', message: 'Decision must be approved, changes_requested, or rejected.' },
        { status: 400 }
      );
    }

    const result = await recordContentDecision({
      contentItemId: id,
      userId: session.sub,
      userRole: session.role,
      workspaceId: session.wid,
      decision,
      notes,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    if (err instanceof WorkflowError) {
      return NextResponse.json(
        { error: err.code, message: err.message, details: err.details },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}
