import fs from 'node:fs';
import path from 'node:path';
import { newDb, DataType } from 'pg-mem';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { seedDatabase } from './seed';

declare global {
  var __inkloomMemoryDrizzle: NodePgDatabase<typeof schema> | undefined;
  var __inkloomMemoryPool: any | undefined;
}

export function initMemoryDatabase(): { pool: any; db: NodePgDatabase<typeof schema> } {
  if (globalThis.__inkloomMemoryDrizzle && globalThis.__inkloomMemoryPool) {
    return {
      pool: globalThis.__inkloomMemoryPool,
      db: globalThis.__inkloomMemoryDrizzle,
    };
  }

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

  // Execute schema migrations synchronously in pg-mem
  const drizzleDir = path.resolve(process.cwd(), 'drizzle');
  const migrationFiles = [
    path.join(drizzleDir, '0000_dark_the_leader.sql'),
    path.join(drizzleDir, '0002_idempotency_keys.sql'),
  ];

  for (const file of migrationFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const stmts = content
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of stmts) {
        try {
          memDb.public.none(stmt);
        } catch {
          // Ignore individual table/trigger statements if not supported in memory
        }
      }
    }
  }

  const pool = new pgAdapter.Pool();
  const drizzleDb = drizzle(pool, { schema });

  // Seed the in-memory database asynchronously
  seedDatabase(drizzleDb).catch((err) => {
    console.warn('[MemoryDB] Seed warning:', err?.message || err);
  });

  globalThis.__inkloomMemoryPool = pool;
  globalThis.__inkloomMemoryDrizzle = drizzleDb;

  return { pool, db: drizzleDb };
}
