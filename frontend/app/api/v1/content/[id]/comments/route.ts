import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { addComment, getComments } from '@/lib/services/comments';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await context.params;

    const list = await getComments(id, session.wid);
    return NextResponse.json({ comments: list });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(req);
    const { id } = await context.params;

    const body = await req.json().catch(() => ({}));
    const { contentVersionId, findingId, body: commentBody } = body;

    if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'body_required', message: 'Comment text is required.' },
        { status: 400 }
      );
    }

    const comment = await addComment({
      contentItemId: id,
      contentVersionId,
      findingId,
      authorId: session.sub,
      workspaceId: session.wid,
      body: commentBody,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}
