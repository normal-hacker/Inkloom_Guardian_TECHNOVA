import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';

export async function GET() {
  const isDemo = serverEnv.isDemoMode;
  const hasGoogle = Boolean(serverEnv.googleClientId && serverEnv.googleClientSecret);

  const demoUsers = isDemo
    ? [
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Asha Patel',
        role: 'creator',
        blurb: 'Submit content and fix flagged issues',
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'Ben Torres',
        role: 'creator',
        blurb: 'A second creator, for approval tests',
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        name: 'Priya Sharma',
        role: 'reviewer',
        blurb: 'Review findings, approve or request changes',
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        name: 'Marcus Vance',
        role: 'manager',
        blurb: 'Rules, insights and audit trail',
      },
    ]
    : [];

  return NextResponse.json({
    demo: isDemo,
    password: true,
    google: hasGoogle,
    demoUsers,
  });
}
