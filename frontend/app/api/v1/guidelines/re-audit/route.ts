import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { reAuditApprovedContent, resetFactAndReAudit } from '@/lib/services/guidelines';
import { SEED_WORKSPACE_ID, SEED_USERS } from '@/lib/db/seed';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const workspaceId = session?.wid || SEED_WORKSPACE_ID;
    const actorId = session?.sub || SEED_USERS.MARCUS;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const action = body.action || 'update';
    const factKey = body.factKey || 'F-001';
    const newValue = typeof body.newValue === 'number' ? body.newValue : 15;

    if (action === 'reset') {
      const result = await resetFactAndReAudit(workspaceId, actorId);
      return NextResponse.json(result);
    }

    const result = await reAuditApprovedContent(workspaceId, actorId, factKey, newValue);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 're_audit_failed',
          message: error?.message || 'Failed to re-audit approved content.',
        },
      },
      { status: 500 }
    );
  }
}
