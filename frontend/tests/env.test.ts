import { describe, expect, it } from 'vitest';
import { clientEnv, serverEnv } from '../src/lib/env';

describe('Environment configuration', () => {
  it('exposes client-safe NEXT_PUBLIC_API_URL', () => {
    expect(clientEnv.apiUrl).toBeDefined();
    expect(typeof clientEnv.apiUrl).toBe('string');
    expect(clientEnv.apiUrl).toBe('/api/v1');
  });

  it('loads server-side environment variables properly', () => {
    expect(serverEnv.databaseUrl).toContain('postgres');
    expect(serverEnv.sessionSecret).toBe('your-random-secret');
    expect(serverEnv.isDemoMode).toBe(true);
    expect(serverEnv.aiProvider).toBe('mock');
    expect(serverEnv.aiTimeoutSeconds).toBe(20);
    expect(serverEnv.maxUploadMb).toBe(10);
    expect(serverEnv.authBaseUrl).toBe('http://localhost:3000');
  });

  it('prevents exposing secrets on client-side environment', () => {
    // Simulate window defined (client environment)
    (globalThis as unknown as { window: unknown }).window = {};
    try {
      expect(() => serverEnv.databaseUrl).toThrow(/Security violation/);
      expect(() => serverEnv.sessionSecret).toThrow(/Security violation/);
      expect(() => serverEnv.aiApiKey).toThrow(/Security violation/);
      expect(() => serverEnv.googleClientSecret).toThrow(/Security violation/);
    } finally {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });
});
