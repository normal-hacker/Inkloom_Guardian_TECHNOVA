import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';

export async function addComment(params: {
  contentItemId: string;
  contentVersionId?: string;
  findingId?: string;
  authorId: string;
  workspaceId: string;
  body: string;
}) {
  const { contentItemId, contentVersionId, findingId, authorId, workspaceId, body } = params;

  if (!body || body.trim().length === 0) {
    throw new Error('Comment body cannot be empty.');
  }

  // Verify content exists
  const items = await db
    .select()
    .from(schema.contentItems)
    .where(eq(schema.contentItems.id, contentItemId))
    .limit(1);

  if (!items.length || items[0].workspaceId !== workspaceId) {
    throw new Error('Content item not found.');
  }

  const commentId = crypto.randomUUID();
  const now = new Date();

  await db.insert(schema.comments).values({
    id: commentId,
    contentItemId,
    contentVersionId: contentVersionId || null,
    findingId: findingId || null,
    authorId,
    body: body.trim(),
    createdAt: now,
  });

  // Write audit
  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: authorId,
    action: 'comment.create',
    entityType: 'comment',
    entityId: commentId,
    detail: {
      contentItemId,
      contentVersionId,
      findingId,
    },
  });

  // Fetch author details for rich return
  const users = await db
    .select({
      email: schema.users.email,
      displayName: schema.users.displayName,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.id, authorId))
    .limit(1);

  const author = users[0] || {
    email: 'user@brightway.example',
    displayName: 'User',
    role: 'creator',
  };

  return {
    id: commentId,
    contentItemId,
    contentVersionId: contentVersionId || null,
    findingId: findingId || null,
    authorId,
    authorEmail: author.email,
    authorName: author.displayName,
    authorRole: author.role,
    body: body.trim(),
    createdAt: now.toISOString(),
  };
}

export async function deleteComment(params: {
  commentId: string;
  authorId: string;
  workspaceId: string;
}) {
  const { commentId, authorId, workspaceId } = params;

  const existing = await db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.id, commentId))
    .limit(1);

  if (!existing.length) {
    // Idempotent delete: returns success even if already deleted
    return { success: true, alreadyDeleted: true, id: commentId };
  }

  const comment = existing[0];
  if (comment.authorId !== authorId) {
    throw new Error('Forbidden: You can only delete your own comments.');
  }

  await db.delete(schema.comments).where(eq(schema.comments.id, commentId));

  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: authorId,
    action: 'comment.delete',
    entityType: 'comment',
    entityId: commentId,
    detail: { contentItemId: comment.contentItemId },
  });

  return { success: true, id: commentId };
}

export async function editComment(params: {
  commentId: string;
  authorId: string;
  workspaceId: string;
  newBody: string;
}) {
  const { commentId, authorId, workspaceId, newBody } = params;

  if (!newBody || newBody.trim().length === 0) {
    throw new Error('Comment body cannot be empty.');
  }

  const existing = await db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.id, commentId))
    .limit(1);

  if (!existing.length) {
    throw new Error('Comment not found.');
  }

  const comment = existing[0];
  if (comment.authorId !== authorId) {
    throw new Error('Forbidden: You can only edit your own comments.');
  }

  await db
    .update(schema.comments)
    .set({ body: newBody.trim() })
    .where(eq(schema.comments.id, commentId));

  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: authorId,
    action: 'comment.edit',
    entityType: 'comment',
    entityId: commentId,
    detail: { contentItemId: comment.contentItemId },
  });

  return { success: true, id: commentId, body: newBody.trim() };
}

export async function getComments(contentItemId: string, workspaceId: string) {
  // Verify content exists in workspace
  const items = await db
    .select()
    .from(schema.contentItems)
    .where(eq(schema.contentItems.id, contentItemId))
    .limit(1);

  if (!items.length || items[0].workspaceId !== workspaceId) {
    throw new Error('Content item not found.');
  }

  const list = await db
    .select({
      id: schema.comments.id,
      contentItemId: schema.comments.contentItemId,
      contentVersionId: schema.comments.contentVersionId,
      findingId: schema.comments.findingId,
      authorId: schema.comments.authorId,
      authorEmail: schema.users.email,
      authorName: schema.users.displayName,
      authorRole: schema.users.role,
      body: schema.comments.body,
      createdAt: schema.comments.createdAt,
    })
    .from(schema.comments)
    .innerJoin(schema.users, eq(schema.comments.authorId, schema.users.id))
    .where(eq(schema.comments.contentItemId, contentItemId))
    .orderBy(desc(schema.comments.createdAt));

  return list;
}
