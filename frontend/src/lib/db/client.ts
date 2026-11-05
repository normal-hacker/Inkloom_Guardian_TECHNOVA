import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import { serverEnv } from '../env';

const { Pool } = pg;

let globalPool: pg.Pool | null = null;
let globalDb: NodePgDatabase<typeof schema> | null = null;

export function getPool(): pg.Pool {
  if (!globalPool) {
    const url = serverEnv.databaseUrl;
    globalPool = new Pool({
      connectionString: url,
      ssl: url.includes('supabase.com') || url.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return globalPool;
}

export function setCustomPool(pool: pg.Pool): void {
  globalPool = pool;
  globalDb = drizzle(pool, { schema });
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!globalDb) {
    globalDb = drizzle(getPool(), { schema });
  }
  return globalDb;
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
