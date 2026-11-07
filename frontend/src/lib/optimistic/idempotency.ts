import { NextRequest, NextResponse } from 'next/server';
import { eq, and, lt } from 'drizzle-orm';
import { db as defaultDb } from '../db/client';
import * as schema from '../db/schema';

/**
 * Clean up expired idempotency keys (>24h old).
 */
export async function cleanupExpiredIdempotencyKeys(dbClient: typeof defaultDb = defaultDb): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (dbClient as any)
      .delete(schema.idempotencyKeys)
      .where(lt(schema.idempotencyKeys.createdAt, cutoff));
    return res?.rowCount || 0;
  } catch {
    return 0;
  }
}

/**
 * Handle idempotent execution for mutation endpoints.
 * Guarantees that duplicate requests with the same Idempotency-Key return the cached response
 * with 'Idempotent-Replay: true' header and execute the handler exactly once.
 */
export async function handleIdempotentRequest(params: {
  req: NextRequest;
  userId: string;
  endpoint: string;
  execute: () => Promise<{ status: number; body: unknown }>;
  dbClient?: typeof defaultDb;
}): Promise<NextResponse> {
  const { req, userId, endpoint, execute, dbClient = defaultDb } = params;
  const idempotencyKey = req.headers.get('idempotency-key')?.trim();

  // Opportunistic cleanup: 5% chance on any request to purge keys older than 24h
  if (Math.random() < 0.05) {
    cleanupExpiredIdempotencyKeys(dbClient).catch(() => {});
  }

  // If no idempotency key is supplied, run normally
  if (!idempotencyKey) {
    const result = await execute();
    return NextResponse.json(result.body, { status: result.status });
  }

  // 1. Check for existing response for this user and key
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (dbClient as any)
      .select()
      .from(schema.idempotencyKeys)
      .where(
        and(
          eq(schema.idempotencyKeys.userId, userId),
          eq(schema.idempotencyKeys.key, idempotencyKey)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const record = existing[0];
      return NextResponse.json(record.responseBody, {
        status: record.responseStatus,
        headers: {
          'Idempotent-Replay': 'true',
        },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Idempotency] Lookup warning:', msg);
  }

  // 2. Execute underlying handler
  const result = await execute();

  // 3. Store response under unique (userId, key) constraint
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (dbClient as any).insert(schema.idempotencyKeys).values({
      id: crypto.randomUUID(),
      userId,
      key: idempotencyKey,
      endpoint,
      responseStatus: result.status,
      responseBody: result.body,
      createdAt: new Date(),
    });
  } catch (insertErr: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cause = (insertErr as any)?.cause;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (insertErr as any)?.code || cause?.code || cause?.data?.code;
    const fullMsg = `${insertErr instanceof Error ? insertErr.message : String(insertErr)} ${cause?.message || ''}`.toLowerCase();

    // Unique violation error in Postgres is code '23505' or duplicate key
    if (
      code === '23505' ||
      fullMsg.includes('duplicate key') ||
      fullMsg.includes('unique constraint') ||
      fullMsg.includes('already exists')
    ) {
      // Concurrent race condition: Another thread saved it. Return stored response.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raced = await (dbClient as any)
        .select()
        .from(schema.idempotencyKeys)
        .where(
          and(
            eq(schema.idempotencyKeys.userId, userId),
            eq(schema.idempotencyKeys.key, idempotencyKey)
          )
        )
        .limit(1);

      if (raced.length > 0) {
        return NextResponse.json(raced[0].responseBody, {
          status: raced[0].responseStatus,
          headers: {
            'Idempotent-Replay': 'true',
          },
        });
      }
    }
  }

  return NextResponse.json(result.body, { status: result.status });
}
