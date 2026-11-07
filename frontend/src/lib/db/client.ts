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
  // eslint-disable-next-line no-var
  var __inkloomDbInitialized: boolean | undefined;
}

export function getPool(): pg.Pool {
  if (!globalThis.__inkloomPgPool) {
    const url = serverEnv.databaseUrl;
    if (!url) {
      console.warn('[DB Client] Warning: DATABASE_URL is not set in environment.');
    }
    const isRemote =
      Boolean(url) &&
      !url.includes('localhost') &&
      !url.includes('127.0.0.1') &&
      !url.includes('inkloom-guardian-db');

    const requiresSsl =
      Boolean(url) &&
      (url.includes('supabase.') ||
        url.includes('sslmode=require') ||
        url.includes('neon.tech') ||
        url.includes('amazonaws.com') ||
        (process.env.NODE_ENV === 'production' && isRemote));

    // Strip sslmode parameter from connection string so pg-connection-string
    // does not overwrite our explicit ssl object ({ rejectUnauthorized: false })
    // which causes 'self-signed certificate in certificate chain' errors with Supabase pooler.
    const cleanUrl = url ? url.replace(/[?&]sslmode=[^&]+/gi, '') : url;

    globalThis.__inkloomPgPool = new Pool({
      connectionString: cleanUrl,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
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
