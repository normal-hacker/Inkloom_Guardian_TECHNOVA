import dotenv from 'dotenv';
import path from 'node:path';

// If running in a Node.js process (scripts, server-side), ensure root and local envs are loaded
if (typeof window === 'undefined') {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
  dotenv.config({ path: path.resolve(process.cwd(), '../.env.test') });
}

function assertServer(variableName: string): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      `Security violation: Server-side environment variable "${variableName}" cannot be accessed on the client.`
    );
  }
}

/**
 * Client-safe environment configuration (only NEXT_PUBLIC_* variables)
 */
export const clientEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
};

/**
 * Server-only environment configuration.
 * Any attempt to access these from the browser throws immediately.
 */
export const serverEnv = {
  get databaseUrl(): string {
    assertServer('DATABASE_URL');
    return process.env.DATABASE_URL || '';
  },
  get postgresUser(): string {
    assertServer('POSTGRES_USER');
    return process.env.POSTGRES_USER || 'guardian';
  },
  get postgresPassword(): string {
    assertServer('POSTGRES_PASSWORD');
    return process.env.POSTGRES_PASSWORD || 'guardian';
  },
  get postgresDb(): string {
    assertServer('POSTGRES_DB');
    return process.env.POSTGRES_DB || 'guardian';
  },
  get postgresPort(): number {
    assertServer('POSTGRES_PORT');
    const parsed = parseInt(process.env.POSTGRES_PORT || '5432', 10);
    return isNaN(parsed) ? 5432 : parsed;
  },
  get sessionSecret(): string {
    assertServer('SESSION_SECRET');
    return process.env.SESSION_SECRET || '';
  },
  get isDemoMode(): boolean {
    assertServer('DEMO_MODE');
    return process.env.DEMO_MODE !== 'false';
  },
  get authBaseUrl(): string {
    assertServer('AUTH_BASE_URL');
    if (process.env.AUTH_BASE_URL) {
      return process.env.AUTH_BASE_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
  },
  get aiProvider(): string {
    assertServer('AI_PROVIDER');
    return process.env.AI_PROVIDER || 'mock';
  },
  get aiModel(): string {
    assertServer('AI_MODEL');
    return process.env.AI_MODEL || '';
  },
  get aiApiKey(): string {
    assertServer('AI_API_KEY');
    return process.env.AI_API_KEY || '';
  },
  get aiTimeoutSeconds(): number {
    assertServer('AI_TIMEOUT_S');
    const parsed = parseInt(process.env.AI_TIMEOUT_S || '20', 10);
    return isNaN(parsed) ? 20 : parsed;
  },
  get maxUploadMb(): number {
    assertServer('MAX_UPLOAD_MB');
    const parsed = parseInt(process.env.MAX_UPLOAD_MB || '10', 10);
    return isNaN(parsed) ? 10 : parsed;
  },
  get googleClientId(): string {
    assertServer('GOOGLE_CLIENT_ID');
    return process.env.GOOGLE_CLIENT_ID || '';
  },
  get googleClientSecret(): string {
    assertServer('GOOGLE_CLIENT_SECRET');
    return process.env.GOOGLE_CLIENT_SECRET || '';
  },
  get isGoogleAuthEnabled(): boolean {
    assertServer('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET');
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.AUTH_BASE_URL
    );
  },
};
