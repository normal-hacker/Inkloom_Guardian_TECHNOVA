import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/lib/auth/guards';
import { importYamlRules, GuidelinesError } from '@/lib/services/guidelines';

export async function POST(req: NextRequest) {
  try {
    const session = requireAuth(req);
    requireRole(['manager'], session);

    const body = await req.json().catch(() => ({}));
    const { yaml } = body;

    if (!yaml || typeof yaml !== 'string') {
      return NextResponse.json(
        { error: 'yaml_required', message: 'A YAML string property "yaml" is required.' },
        { status: 400 }
      );
    }

    const result = await importYamlRules(session.wid, session.sub, yaml);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    if (err instanceof GuidelinesError) {
      return NextResponse.json(
        { error: err.code, message: err.message, details: err.details },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}
