import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { submitContent, WorkflowError } from '@/lib/services/workflow';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await context.params;

    const result = await submitContent({
      contentItemId: id,
      userId: session.sub,
      userRole: session.role,
      workspaceId: session.wid,
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
