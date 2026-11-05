import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/lib/auth/guards';
import { exportAuditCsv } from '@/lib/services/audit';

export async function GET(req: NextRequest) {
  try {
    const session = requireAuth(req);
    // Manager only role guard
    requireRole(['manager'], session);

    const csvData = await exportAuditCsv(session.wid);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="audit_log_export.csv"',
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}
