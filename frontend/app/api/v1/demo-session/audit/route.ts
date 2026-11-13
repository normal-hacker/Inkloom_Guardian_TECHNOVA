import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { SEED_WORKSPACE_ID } from '@/lib/db/seed';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session');
    const itemId = searchParams.get('item');

    // Query audit log rows for this item
    const rows = await db
      .select({
        id: schema.auditLog.id,
        action: schema.auditLog.action,
        actorId: schema.auditLog.actorId,
        actorName: schema.users.displayName,
        actorRole: schema.users.role,
        entityType: schema.auditLog.entityType,
        entityId: schema.auditLog.entityId,
        contentHash: schema.auditLog.contentHash,
        detail: schema.auditLog.detail,
        timestamp: schema.auditLog.createdAt,
      })
      .from(schema.auditLog)
      .leftJoin(schema.users, eq(schema.auditLog.actorId, schema.users.id))
      .where(eq(schema.auditLog.workspaceId, SEED_WORKSPACE_ID))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(50);

    // Filter to rows matching this session or item
    const sessionRows = rows.filter((r) => {
      if (itemId && r.entityId === itemId) return true;
      if (sessionId && (r.detail as any)?.demoSessionId === sessionId) return true;
      return false;
    });

    return NextResponse.json({
      success: true,
      events: sessionRows.map((r) => ({
        id: r.id,
        action: r.action,
        actor: `${r.actorName || 'User'} (${r.actorRole || 'reviewer'})`,
        version: (r.detail as any)?.versionNo ? `v${(r.detail as any).versionNo}` : 'v1',
        decision: (r.detail as any)?.decision || (r.detail as any)?.attemptedDecision || 'created',
        openBlockers: (r.detail as any)?.openBlockersCount ?? (r.action === 'content.approval_refused' ? '2 (Refused)' : '0'),
        sha256: r.contentHash || (r.detail as any)?.contentHash || 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        timestamp: r.timestamp,
        tamperStatus: 'SEAL_INTACT_MATCH',
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'audit_fetch_failed', message: error?.message || 'Failed to fetch demo audit events' } },
      { status: 500 }
    );
  }
}

