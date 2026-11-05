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

  await db.insert(schema.comments).values({
    id: commentId,
    contentItemId,
    contentVersionId: contentVersionId || null,
    findingId: findingId || null,
    authorId,
    body: body.trim(),
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

  return { id: commentId, contentItemId, body: body.trim() };
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
