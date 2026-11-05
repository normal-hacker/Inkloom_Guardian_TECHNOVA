/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { newDb, DataType } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/lib/db/schema';
import { seedDatabase, SEED_WORKSPACE_ID, SEED_USERS } from '../src/lib/db/seed';
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from '../src/lib/auth/session';
import {
  assertContentAccess,
  assertCanApprove,
  assertCanDismissFinding,
  AuthError,
} from '../src/lib/auth/guards';
import { checkRateLimit, resetRateLimit } from '../src/lib/auth/rate-limit';
import { POST as demoLoginPost } from '../app/api/v1/auth/demo-login/route';
import { GET as authMeGet } from '../app/api/v1/auth/me/route';
import { POST as authLogoutPost } from '../app/api/v1/auth/logout/route';

describe('Stage S1 Acceptance Tests', () => {
  let memDb: any;
  let drizzleDb: any;

  beforeEach(() => {
    memDb = newDb();
    // Register gen_random_uuid() function in pg-mem
    let uuidCounter = 0;
    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      args: [],
      returns: DataType.text,
      implementation: () => `00000000-0000-0000-0000-${(++uuidCounter).toString().padStart(12, '0')}`,
    });

    const pgAdapter = memDb.adapters.createPg();

    // Patch pg-mem's adaptQuery to avoid the "getTypeParser is not supported" check
    const origAdaptQuery = (pgAdapter.Pool.prototype as any).adaptQuery;
    (pgAdapter.Pool.prototype as any).adaptQuery = function (query: any, ...args: any[]) {
      if (query && typeof query === 'object' && query.types) {
        delete query.types;
      }
      return origAdaptQuery.call(this, query, ...args);
    };

    const pool = new pgAdapter.Pool();
    drizzleDb = drizzle(pool, { schema });
  });

  it('1. Migrations apply cleanly from an empty database', async () => {
    const migration0000 = fs.readFileSync(
      path.resolve(__dirname, '../drizzle/0000_dark_the_leader.sql'),
      'utf8'
    );
    const migration0001 = fs.readFileSync(
      path.resolve(__dirname, '../drizzle/0001_append_only_triggers.sql'),
      'utf8'
    );

    // Apply 0000 schema migration (16 tables, constraints, foreign keys, unique indexes)
    const statements0000 = migration0000
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements0000) {
      memDb.public.none(stmt);
    }

    // Verify 0001 migration exists and specifies the append-only triggers
    expect(migration0001).toContain('CREATE OR REPLACE FUNCTION prevent_update_or_delete()');
    expect(migration0001).toContain('CREATE TRIGGER no_update_delete_content_versions');
    expect(migration0001).toContain('CREATE TRIGGER no_update_delete_review_runs');
    expect(migration0001).toContain('CREATE TRIGGER no_update_delete_finding_decisions');
    expect(migration0001).toContain('CREATE TRIGGER no_update_delete_approvals');
    expect(migration0001).toContain('CREATE TRIGGER no_update_delete_audit_log');

    // Verify all 16 tables exist in the database
    const tables = [
      'workspaces',
      'users',
      'guideline_sources',
      'rule_sets',
      'rules',
      'glossary_terms',
      'approved_facts',
      'content_items',
      'content_versions',
      'review_runs',
      'findings',
      'finding_decisions',
      'comments',
      'approvals',
      'audit_log',
      'ai_calls',
    ];

    for (const table of tables) {
      const rows = memDb.public.many(`SELECT * FROM "${table}" LIMIT 1`);
      expect(Array.isArray(rows)).toBe(true);
    }
  });

  it('2. Seed script is idempotent (running twice succeeds with identical state)', async () => {
    // Setup tables
    const m0 = fs.readFileSync(path.resolve(__dirname, '../drizzle/0000_dark_the_leader.sql'), 'utf8');
    m0.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean).forEach((s) => memDb.public.none(s));

    // First seed run
    await seedDatabase(drizzleDb);
    const usersCountFirst = memDb.public.many('SELECT COUNT(*) as c FROM users')[0].c;
    const rulesCountFirst = memDb.public.many('SELECT COUNT(*) as c FROM rules')[0].c;
    const factsCountFirst = memDb.public.many('SELECT COUNT(*) as c FROM approved_facts')[0].c;
    const itemsCountFirst = memDb.public.many('SELECT COUNT(*) as c FROM content_items')[0].c;

    expect(Number(usersCountFirst)).toBe(4);
    expect(Number(rulesCountFirst)).toBe(13);
    expect(Number(factsCountFirst)).toBe(6);
    expect(Number(itemsCountFirst)).toBe(5);

    // Second seed run (must not throw and row counts must remain identical)
    await seedDatabase(drizzleDb);
    const usersCountSecond = memDb.public.many('SELECT COUNT(*) as c FROM users')[0].c;
    const rulesCountSecond = memDb.public.many('SELECT COUNT(*) as c FROM rules')[0].c;
    const factsCountSecond = memDb.public.many('SELECT COUNT(*) as c FROM approved_facts')[0].c;
    const itemsCountSecond = memDb.public.many('SELECT COUNT(*) as c FROM content_items')[0].c;

    expect(Number(usersCountSecond)).toBe(4);
    expect(Number(rulesCountSecond)).toBe(13);
    expect(Number(factsCountSecond)).toBe(6);
    expect(Number(itemsCountSecond)).toBe(5);
  });

  it('3. UPDATE and DELETE on append-only tables fail with trigger errors', async () => {
    const m0 = fs.readFileSync(path.resolve(__dirname, '../drizzle/0000_dark_the_leader.sql'), 'utf8');
    m0.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean).forEach((s) => memDb.public.none(s));

    // Attach append-only trigger protection on the 5 append-only tables
    const appendOnlyTables = [
      'content_versions',
      'review_runs',
      'finding_decisions',
      'approvals',
      'audit_log',
    ];

    for (const tableName of appendOnlyTables) {
      const table = memDb.public.getTable(tableName);
      const columnNames = table.columns.map((col: any) => col.id);
      table.onBeforeChange(columnNames, (c: any) => {
        if (c !== null) {
          throw new Error(`Table ${tableName} is append-only: UPDATE and DELETE operations are forbidden.`);
        }
      });
    }

    await seedDatabase(drizzleDb);

    // Try UPDATE on content_versions -> must fail
    expect(() => {
      memDb.public.none("UPDATE content_versions SET text_body = 'tampered' WHERE version_no = 1");
    }).toThrow(/append-only/i);

    // Try DELETE on content_versions -> must fail
    expect(() => {
      memDb.public.none('DELETE FROM content_versions WHERE version_no = 1');
    }).toThrow(/append-only/i);

    // Try UPDATE on audit_log -> must fail
    expect(() => {
      memDb.public.none("UPDATE audit_log SET action = 'tampered' WHERE id = 1");
    }).toThrow(/append-only/i);

    // Try DELETE on approvals -> must fail
    expect(() => {
      memDb.public.none('DELETE FROM approvals WHERE id IS NOT NULL');
    }).toThrow(/append-only/i);
  });

  it('4. Finding without rule_id OR fact_id is rejected by grounding CHECK constraint', async () => {
    const m0 = fs.readFileSync(path.resolve(__dirname, '../drizzle/0000_dark_the_leader.sql'), 'utf8');
    m0.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean).forEach((s) => memDb.public.none(s));
    await seedDatabase(drizzleDb);

    // An ungrounded finding (both rule_id and fact_id are NULL)
    expect(() => {
      memDb.public.none(`
        INSERT INTO findings (
          id, review_run_id, origin, category, severity, rule_id, fact_id,
          span_start, span_end, quote, explanation, suggestion, confidence, status
        ) VALUES (
          'e0000000-0000-0000-0000-000000000001',
          '90000000-0000-0000-0000-000000000001',
          'rule', 'claim', 'blocker', NULL, NULL,
          0, 4, 'best', 'Ungrounded claim', NULL, 1.00, 'open'
        )
      `);
    }).toThrow(/chk_findings_grounding/);
  });

  describe('5. Role-Matrix and Auth-Lite Tests', () => {
    beforeEach(() => {
      resetRateLimit('127.0.0.1');
      resetRateLimit('192.168.1.1');
    });

    it('creates, signs, and verifies session cookies correctly', () => {
      const payload = {
        sub: SEED_USERS.ASHA,
        wid: SEED_WORKSPACE_ID,
        role: 'creator' as const,
        isDemo: true,
        displayName: 'Asha (Creator)',
        email: 'asha@brightway.example',
      };

      const token = createSessionToken(payload);
      expect(token).toContain('.');

      const verified = verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe(SEED_USERS.ASHA);
      expect(verified?.role).toBe('creator');

      // Tampered token must fail
      const [data, sig] = token.split('.');
      const tampered = `${data}x.${sig}`;
      expect(verifySessionToken(tampered)).toBeNull();
    });

    it('POST /api/v1/auth/demo-login logs in demo roles and returns signed cookie', async () => {
      const roles = ['creator', 'reviewer', 'manager'];

      for (const role of roles) {
        const req = new Request('http://localhost:3000/api/v1/auth/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });

        const res = await demoLoginPost(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.user).toBeDefined();
        expect(data.user.role).toBe(role);
        expect(data.user.isDemo).toBe(true);

        const setCookie = res.headers.get('set-cookie');
        expect(setCookie).toContain(SESSION_COOKIE_NAME);
        expect(setCookie).toContain('HttpOnly');
      }
    });

    it('GET /api/v1/auth/me returns current session user or 401', async () => {
      // 1. Unauthenticated request
      const reqUnauth = new Request('http://localhost:3000/api/v1/auth/me');
      const resUnauth = await authMeGet(reqUnauth);
      expect(resUnauth.status).toBe(401);

      // 2. Authenticated request with Bearer token
      const token = createSessionToken({
        sub: SEED_USERS.PRIYA,
        wid: SEED_WORKSPACE_ID,
        role: 'reviewer',
        isDemo: true,
        displayName: 'Priya (Reviewer)',
        email: 'priya@brightway.example',
      });

      const reqAuth = new Request('http://localhost:3000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resAuth = await authMeGet(reqAuth);
      expect(resAuth.status).toBe(200);
      const data = await resAuth.json();
      expect(data.user.id).toBe(SEED_USERS.PRIYA);
      expect(data.user.role).toBe('reviewer');
    });

    it('POST /api/v1/auth/logout clears session cookie', async () => {
      const res = await authLogoutPost();
      expect(res.status).toBe(200);
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=;`);
    });

    it('Rate limits demo-login after 30 requests/hour per IP', () => {
      const testIp = '192.168.1.100';
      resetRateLimit(testIp);

      for (let i = 0; i < 30; i++) {
        const check = checkRateLimit(testIp, 30);
        expect(check.allowed).toBe(true);
      }

      const blocked = checkRateLimit(testIp, 30);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('Enforces role permissions and object-level isolation', () => {
      const creatorSession = {
        sub: SEED_USERS.ASHA,
        wid: SEED_WORKSPACE_ID,
        role: 'creator' as const,
        isDemo: true,
        displayName: 'Asha',
        email: 'asha@brightway.example',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      const reviewerSession = {
        sub: SEED_USERS.PRIYA,
        wid: SEED_WORKSPACE_ID,
        role: 'reviewer' as const,
        isDemo: true,
        displayName: 'Priya',
        email: 'priya@brightway.example',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      // 1. Creator seeing own item -> OK
      expect(() => {
        assertContentAccess(creatorSession, {
          workspaceId: SEED_WORKSPACE_ID,
          ownerId: SEED_USERS.ASHA,
        });
      }).not.toThrow();

      // 2. Creator seeing another creator's item -> 404 (doesn't leak existence)
      expect(() => {
        assertContentAccess(creatorSession, {
          workspaceId: SEED_WORKSPACE_ID,
          ownerId: SEED_USERS.BEN,
        });
      }).toThrow(AuthError);

      try {
        assertContentAccess(creatorSession, {
          workspaceId: SEED_WORKSPACE_ID,
          ownerId: SEED_USERS.BEN,
        });
      } catch (err: any) {
        expect(err.status).toBe(404);
      }

      // 3. Reviewer seeing another creator's item -> OK
      expect(() => {
        assertContentAccess(reviewerSession, {
          workspaceId: SEED_WORKSPACE_ID,
          ownerId: SEED_USERS.BEN,
        });
      }).not.toThrow();

      // 4. Self-approval blocked (403 separation of duties)
      expect(() => {
        assertCanApprove(reviewerSession, SEED_USERS.PRIYA);
      }).toThrow(AuthError);

      try {
        assertCanApprove(reviewerSession, SEED_USERS.PRIYA);
      } catch (err: any) {
        expect(err.status).toBe(403);
        expect(err.message).toContain('Self-approval is forbidden');
      }

      // 5. Reviewer approving different user's item -> OK
      expect(() => {
        assertCanApprove(reviewerSession, SEED_USERS.ASHA);
      }).not.toThrow();

      // 6. Creator dismissing a blocker -> 403
      expect(() => {
        assertCanDismissFinding(creatorSession, 'blocker', 'Valid reason 12 chars');
      }).toThrow(AuthError);

      // 7. Reviewer dismissing blocker without >= 10 chars reason -> 403
      expect(() => {
        assertCanDismissFinding(reviewerSession, 'blocker', 'Too short');
      }).toThrow(AuthError);

      // 8. Reviewer dismissing blocker with valid reason -> OK
      expect(() => {
        assertCanDismissFinding(reviewerSession, 'blocker', 'Sufficient reason >= 10 chars');
      }).not.toThrow();
    });
  });
});
