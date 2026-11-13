import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Public sample CSV export for seeded demonstration ledger (unauthenticated allowed)
  const csvData = [
    'id,action,actor,entity_type,entity_id,content_hash,created_at,tamper_status',
    '80000000-0000-0000-0000-000000000001,content.create,Asha (Creator),content_item,70000000-0000-0000-0000-000000000001,ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad,2026-02-01T10:05:00Z,SEAL_INTACT_MATCH',
    '80000000-0000-0000-0000-000000000002,content.check,Asha (Creator),content_item,70000000-0000-0000-0000-000000000001,ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad,2026-02-01T10:05:02Z,SEAL_INTACT_MATCH',
    '80000000-0000-0000-0000-000000000003,finding.override,Priya (Reviewer),finding,50000000-0000-0000-0000-000000000001,ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad,2026-02-01T10:45:00Z,SEAL_INTACT_MATCH',
    '80000000-0000-0000-0000-000000000004,content.approve,Priya (Reviewer),content_item,70000000-0000-0000-0000-000000000001,610f9e1e3b08e5efc9826d91f24d2ef1dfbfd31b0fc2bd0df22ff411a7dbcb18,2026-02-01T11:00:00Z,SEAL_INTACT_MATCH',
  ].join('\n');

  return new NextResponse(csvData, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="inkloom-sample-audit-ledger.csv"',
    },
  });
}

