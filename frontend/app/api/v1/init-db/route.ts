import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getPool } from '@/lib/db/client';
import { ensureDatabaseInitialized } from '@/lib/db/init';

export const dynamic = 'force-dynamic';

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    const initResult = await ensureDatabaseInitialized();
    const pool = getPool();

    // Query stats to confirm readiness
    let stats: Record<string, number> = {};
    try {
      const [ws, users, rules, content] = await Promise.all([
        pool.query('SELECT COUNT(*)::int as count FROM workspaces;'),
        pool.query('SELECT COUNT(*)::int as count FROM users;'),
        pool.query('SELECT COUNT(*)::int as count FROM rules;'),
        pool.query('SELECT COUNT(*)::int as count FROM content_items;'),
      ]);
      stats = {
        workspaces: ws.rows[0]?.count ?? 0,
        users: users.rows[0]?.count ?? 0,
        rules: rules.rows[0]?.count ?? 0,
        contentItems: content.rows[0]?.count ?? 0,
      };
    } catch (queryErr: any) {
      console.warn('[init-db] Stats query warning:', queryErr.message);
    }

    return NextResponse.json(
      {
        status: 'ok',
        requestId,
        initResult,
        stats,
        message: 'Database schema and seed verified successfully.',
      },
      {
        status: 200,
        headers: { 'X-Request-ID': requestId },
      }
    );
  } catch (err: any) {
    console.error('[init-db] Error:', err);
    return NextResponse.json(
      {
        status: 'error',
        requestId,
        error: err.message,
        code: err.code || err.cause?.code,
        detail: err.detail || err.cause?.detail,
      },
      {
        status: 500,
        headers: { 'X-Request-ID': requestId },
      }
    );
  }
}

export async function POST() {
  return GET();
}
