import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import { serverEnv } from '../env';

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __inkloomPgPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __inkloomDrizzleDb: NodePgDatabase<typeof schema> | undefined;
}

export function getPool(): pg.Pool {
  if (!globalThis.__inkloomPgPool) {
    const url = serverEnv.databaseUrl;
    globalThis.__inkloomPgPool = new Pool({
      connectionString: url,
      ssl: url.includes('supabase.com') || url.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return globalThis.__inkloomPgPool;
}

export function setCustomPool(pool: pg.Pool): void {
  globalThis.__inkloomPgPool = pool;
  globalThis.__inkloomDrizzleDb = drizzle(pool, { schema });
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!globalThis.__inkloomDrizzleDb) {
    globalThis.__inkloomDrizzleDb = drizzle(getPool(), { schema });
  }
  return globalThis.__inkloomDrizzleDb;
}

// Proxy export for convenient `db.select()...` usage while preserving lazy initialization
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export type DbClient = NodePgDatabase<typeof schema>;
export { schema };
