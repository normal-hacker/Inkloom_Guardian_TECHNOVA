import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { deleteComment, editComment } from '@/lib/services/comments';

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = requireAuth(req);
    const { commentId } = await context.params;

    const result = await deleteComment({
      commentId,
      authorId: session.sub,
      workspaceId: session.wid,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const status = message.includes('Forbidden') ? 403 : message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: 'error', message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = requireAuth(req);
    const { commentId } = await context.params;

    const body = await req.json().catch(() => ({}));
    const { body: newBody } = body;

    if (!newBody || typeof newBody !== 'string' || newBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'body_required', message: 'Comment text is required.' },
        { status: 400 }
      );
    }

    const result = await editComment({
      commentId,
      authorId: session.sub,
      workspaceId: session.wid,
      newBody: newBody.trim(),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const status = message.includes('Forbidden') ? 403 : message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: 'error', message }, { status });
  }
}

