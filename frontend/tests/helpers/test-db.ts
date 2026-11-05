/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs';
import path from 'node:path';
import { newDb, DataType } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../src/lib/db/schema';
import { setCustomPool } from '../../src/lib/db/client';

export async function createTestDatabase() {
  const memDb = newDb();
  let uuidCounter = 0;
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
  const drizzleDb = drizzle(pool, { schema });
  setCustomPool(pool as any);

  // Run schema migrations
  const migration0000 = fs.readFileSync(
    path.resolve(__dirname, '../../drizzle/0000_dark_the_leader.sql'),
    'utf8'
  );
  const statements = migration0000
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await drizzleDb.execute(stmt);
  }

  return drizzleDb;
}
