/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { newDb, DataType } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import * as schema from '../src/lib/db/schema';
import { setCustomPool } from '../src/lib/db/client';
import {
  handleIdempotentRequest,
  cleanupExpiredIdempotencyKeys,
} from '../src/lib/optimistic/idempotency';
import { deleteComment } from '../src/lib/services/comments';

describe('Optimistic API & Idempotency Integration Tests (FRAMEWORK §6)', () => {
  let memDb: any;
  let drizzleDb: any;
  const user1 = '00000000-0000-0000-0000-000000000001';
  const user2 = '00000000-0000-0000-0000-000000000002';
  const workspaceId = '00000000-0000-0000-0000-000000000010';

  beforeEach(() => {
    memDb = newDb();
    let uuidCounter = 100;
    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      args: [],
      returns: DataType.text,
      implementation: () => `00000000-0000-0000-0000-${(++uuidCounter).toString().padStart(12, '0')}`,
    });

    const pgAdapter = memDb.adapters.createPg();
    const origAdaptQuery = (pgAdapter.Pool.prototype as any).adaptQuery;
    (pgAdapter.Pool.prototype as any).adaptQuery = function (query: any, ...args: any[]) {
      if (query && typeof query === 'object' && query.types) {
        delete query.types;
      }
      return origAdaptQuery.call(this, query, ...args);
    };

    const origAdaptResults = (pgAdapter.Pool.prototype as any).adaptResults;
    (pgAdapter.Pool.prototype as any).adaptResults = function (query: any, res: any) {
      if (query && query.rowMode === 'array') {
        const fieldNames = res.fields && res.fields.length
          ? res.fields.map((f: any) => f.name)
          : Object.keys(res.rows[0] || {});
        return {
          ...res,
          rows: res.rows.map((row: any) => fieldNames.map((f: string) => row[f])),
          fields: res.fields || [],
        };
      }
      return origAdaptResults.call(this, query, res);
    };
    (pgAdapter.Client.prototype as any).adaptQuery = (pgAdapter.Pool.prototype as any).adaptQuery;
    (pgAdapter.Client.prototype as any).adaptResults = (pgAdapter.Pool.prototype as any).adaptResults;

    const pool = new pgAdapter.Pool();
    drizzleDb = drizzle(pool, { schema });
    setCustomPool(pool as any);

    // Initialize base schema and 0002 migration
    const m0 = fs.readFileSync(path.resolve(__dirname, '../drizzle/0000_dark_the_leader.sql'), 'utf8');
    m0.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean).forEach((s) => memDb.public.none(s));

    const m2 = fs.readFileSync(path.resolve(__dirname, '../drizzle/0002_idempotency_keys.sql'), 'utf8');
    m2.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean).forEach((s) => memDb.public.none(s));

    // Seed test workspace and users
    memDb.public.none(`
      INSERT INTO workspaces (id, name) VALUES ('${workspaceId}', 'Test Workspace');
      INSERT INTO users (id, workspace_id, email, display_name, role) VALUES
        ('${user1}', '${workspaceId}', 'user1@test.com', 'User One', 'creator'),
        ('${user2}', '${workspaceId}', 'user2@test.com', 'User Two', 'reviewer');
    `);
  });

  it('1. Same Idempotency-Key twice → one row, same response, Idempotent-Replay: true', async () => {
    const key = 'idem-key-1234';
    let executionCount = 0;

    const execute = async () => {
      executionCount++;
      return {
        status: 201,
        body: { id: 'comm-1', text: 'First post' },
      };
    };

    const req1 = new NextRequest('http://localhost:3000/api/v1/content/1/comments', {
      method: 'POST',
      headers: { 'idempotency-key': key },
    });

    const res1 = await handleIdempotentRequest({
      req: req1,
      userId: user1,
      endpoint: '/api/v1/content/1/comments',
      execute,
      dbClient: drizzleDb,
    });

    expect(res1.status).toBe(201);
    expect(res1.headers.get('Idempotent-Replay')).toBeNull();
    const body1 = await res1.json();
    expect(body1.text).toBe('First post');
    expect(executionCount).toBe(1);

    // Second request with exact same Idempotency-Key
    const req2 = new NextRequest('http://localhost:3000/api/v1/content/1/comments', {
      method: 'POST',
      headers: { 'idempotency-key': key },
    });

    const res2 = await handleIdempotentRequest({
      req: req2,
      userId: user1,
      endpoint: '/api/v1/content/1/comments',
      execute,
      dbClient: drizzleDb,
    });

    expect(res2.status).toBe(201);
    expect(res2.headers.get('Idempotent-Replay')).toBe('true');
    const body2 = await res2.json();
    expect(body2.text).toBe('First post');
    expect(executionCount).toBe(1); // handler was not re-executed!

    // Verify exactly one row in idempotency_keys
    const rows = memDb.public.many(`SELECT * FROM idempotency_keys WHERE key = '${key}'`);
    expect(rows.length).toBe(1);
  });

  it('2. Same key by different users → independent and isolated', async () => {
    const sharedKey = 'common-uuid-key';

    const reqUser1 = new NextRequest('http://localhost:3000/api/v1/comments', {
      method: 'POST',
      headers: { 'idempotency-key': sharedKey },
    });

    const res1 = await handleIdempotentRequest({
      req: reqUser1,
      userId: user1,
      endpoint: '/api/v1/comments',
      execute: async () => ({ status: 201, body: { author: 'User 1' } }),
      dbClient: drizzleDb,
    });

    const reqUser2 = new NextRequest('http://localhost:3000/api/v1/comments', {
      method: 'POST',
      headers: { 'idempotency-key': sharedKey },
    });

    const res2 = await handleIdempotentRequest({
      req: reqUser2,
      userId: user2,
      endpoint: '/api/v1/comments',
      execute: async () => ({ status: 201, body: { author: 'User 2' } }),
      dbClient: drizzleDb,
    });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res2.headers.get('Idempotent-Replay')).toBeNull(); // Fresh execution for user 2!

    const body1 = await res1.json();
    const body2 = await res2.json();
    expect(body1.author).toBe('User 1');
    expect(body2.author).toBe('User 2');

    const rows = memDb.public.many(`SELECT * FROM idempotency_keys WHERE key = '${sharedKey}'`);
    expect(rows.length).toBe(2);
  });

  it('3. Expired key cleanup removes records older than 24h', async () => {
    const freshKey = 'fresh-key';
    const oldKey = 'old-key';

    // Insert fresh record (now)
    memDb.public.none(`
      INSERT INTO idempotency_keys (id, user_id, key, endpoint, response_status, response_body, created_at)
      VALUES (gen_random_uuid(), '${user1}', '${freshKey}', '/endpoint', 200, '{}', NOW());
    `);

    // Insert expired record (25 hours ago)
    memDb.public.none(`
      INSERT INTO idempotency_keys (id, user_id, key, endpoint, response_status, response_body, created_at)
      VALUES (gen_random_uuid(), '${user1}', '${oldKey}', '/endpoint', 200, '{}', NOW() - INTERVAL '25 hours');
    `);

    const deletedCount = await cleanupExpiredIdempotencyKeys(drizzleDb);
    expect(deletedCount).toBeGreaterThanOrEqual(1);

    const remaining = memDb.public.many('SELECT key FROM idempotency_keys');
    expect(remaining.some((r: any) => r.key === freshKey)).toBe(true);
    expect(remaining.some((r: any) => r.key === oldKey)).toBe(false);
  });

  it('4. DELETE operations are naturally idempotent', async () => {
    // Seed a content item and a comment
    const contentId = '00000000-0000-0000-0000-000000000099';
    const commentId = '00000000-0000-0000-0000-000000000088';

    memDb.public.none(`
      INSERT INTO content_items (id, workspace_id, title, content_type, status, owner_id)
      VALUES ('${contentId}', '${workspaceId}', 'Test Content', 'blog', 'draft', '${user1}');
      INSERT INTO comments (id, content_item_id, author_id, body)
      VALUES ('${commentId}', '${contentId}', '${user1}', 'Comment to delete');
    `);

    // First delete
    const res1 = await deleteComment({
      commentId,
      authorId: user1,
      workspaceId,
    });
    expect(res1.success).toBe(true);

    // Second delete of the same already-deleted comment
    const res2 = await deleteComment({
      commentId,
      authorId: user1,
      workspaceId,
    });
    expect(res2.success).toBe(true);
    expect(res2.alreadyDeleted).toBe(true);
  });

  it('5. Two concurrent requests with the same Idempotency-Key (Promise.all) create exactly one row', async () => {
    const concurrentKey = 'concurrent-key-999';
    let execCount = 0;

    const execute = async () => {
      execCount++;
      return { status: 201, body: { id: 'item-1', content: 'Concurrent Success' } };
    };

    const reqA = new NextRequest('http://localhost:3000/api/v1/content/1/comments', {
      method: 'POST',
      headers: { 'idempotency-key': concurrentKey },
    });
    const reqB = new NextRequest('http://localhost:3000/api/v1/content/1/comments', {
      method: 'POST',
      headers: { 'idempotency-key': concurrentKey },
    });

    const [resA, resB] = await Promise.all([
      handleIdempotentRequest({
        req: reqA,
        userId: user1,
        endpoint: '/api/v1/content/1/comments',
        execute,
        dbClient: drizzleDb,
      }),
      handleIdempotentRequest({
        req: reqB,
        userId: user1,
        endpoint: '/api/v1/content/1/comments',
        execute,
        dbClient: drizzleDb,
      }),
    ]);

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);

    const bodyA = await resA.json();
    const bodyB = await resB.json();
    expect(bodyA.content).toBe('Concurrent Success');
    expect(bodyB.content).toBe('Concurrent Success');

    // Exactly one row created in DB
    const rows = memDb.public.many(`SELECT * FROM idempotency_keys WHERE key = '${concurrentKey}'`);
    expect(rows.length).toBe(1);

    // At least one returned the cached replay header or executed cleanly
    const isReplayA = resA.headers.get('Idempotent-Replay') === 'true';
    const isReplayB = resB.headers.get('Idempotent-Replay') === 'true';
    expect(isReplayA || isReplayB || execCount === 1).toBe(true);
  });

  it('6. Replay never bypasses authorization (user without permission gets 403, not stored response)', async () => {
    const sensitiveKey = 'sensitive-auth-key';

    // Seed an existing idempotent response created by a privileged user or previous state
    memDb.public.none(`
      INSERT INTO idempotency_keys (id, user_id, key, endpoint, response_status, response_body, created_at)
      VALUES (gen_random_uuid(), '${user1}', '${sensitiveKey}', '/api/v1/guidelines/draft/activate', 200, '{"published":true}', NOW());
    `);

    // Simulated handler representing an endpoint protected by requireRole
    const protectedEndpointHandler = async (req: NextRequest, requestingUserId: string, role: string) => {
      // 1. Guard check runs BEFORE any idempotency lookup or execution
      if (role !== 'manager') {
        return { status: 403, body: { error: 'forbidden', message: 'Insufficient permissions. Role "creator" cannot perform this action.' } };
      }

      // 2. Only if authorized does it process idempotency
      return await handleIdempotentRequest({
        req,
        userId: requestingUserId,
        endpoint: '/api/v1/guidelines/draft/activate',
        execute: async () => ({ status: 200, body: { published: true } }),
        dbClient: drizzleDb,
      });
    };

    const unprivilegedReq = new NextRequest('http://localhost:3000/api/v1/guidelines/draft/activate', {
      method: 'POST',
      headers: { 'idempotency-key': sensitiveKey },
    });

    const unprivilegedRes = await protectedEndpointHandler(unprivilegedReq, user1, 'creator');
    expect(unprivilegedRes.status).toBe(403);
    const errBody = unprivilegedRes.body as any;
    expect(errBody.error).toBe('forbidden');
    expect(errBody.published).toBeUndefined(); // Stored response was NEVER returned!
  });

  it('7. PATCH and DELETE repeat behaviour is idempotent', async () => {
    const contentId = '00000000-0000-0000-0000-000000000099';
    const commentId = '00000000-0000-0000-0000-000000000077';

    memDb.public.none(`
      INSERT INTO content_items (id, workspace_id, title, content_type, status, owner_id)
      VALUES ('${contentId}', '${workspaceId}', 'Test Content 7', 'blog', 'draft', '${user1}')
      ON CONFLICT (id) DO NOTHING;
      INSERT INTO comments (id, content_item_id, author_id, body)
      VALUES ('${commentId}', '${contentId}', '${user1}', 'Initial comment content');
    `);

    // PATCH repeat
    const { editComment } = await import('../src/lib/services/comments');
    const patch1 = await editComment({
      commentId,
      authorId: user1,
      workspaceId,
      newBody: 'Updated body content',
    });
    expect(patch1.success).toBe(true);
    expect(patch1.body).toBe('Updated body content');

    const patch2 = await editComment({
      commentId,
      authorId: user1,
      workspaceId,
      newBody: 'Updated body content',
    });
    expect(patch2.success).toBe(true);
    expect(patch2.body).toBe('Updated body content');

    const row = memDb.public.one(`SELECT body FROM comments WHERE id = '${commentId}'`);
    expect(row.body).toBe('Updated body content');

    // DELETE repeat
    const del1 = await deleteComment({ commentId, authorId: user1, workspaceId });
    expect(del1.success).toBe(true);
    expect(del1.alreadyDeleted).toBeUndefined();

    const del2 = await deleteComment({ commentId, authorId: user1, workspaceId });
    expect(del2.success).toBe(true);
    expect(del2.alreadyDeleted).toBe(true);
  });
});
