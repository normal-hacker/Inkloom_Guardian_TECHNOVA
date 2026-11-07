import { describe, it, expect, beforeEach } from 'vitest';
import { POST as resetDemoPost } from '../app/api/v1/auth/reset-demo/route';
import { createSessionToken, SESSION_COOKIE_NAME } from '../src/lib/auth/session';
import { SEED_USERS, SEED_WORKSPACE_ID } from '../src/lib/db/seed';
import { initMemoryDatabase } from '../src/lib/db/memory-db';
import { setCustomPool } from '../src/lib/db/client';

describe('Phase R1: Reset Demo Endpoint', () => {
  beforeEach(() => {
    const { pool } = initMemoryDatabase();
    setCustomPool(pool);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost:3000/api/v1/auth/reset-demo', {
      method: 'POST',
    });
    const res = await resetDemoPost(req);
    expect(res.status).toBe(401);
  });

  it('rejects non-demo users with 403', async () => {
    const token = createSessionToken({
      sub: '99999999-9999-9999-9999-999999999999',
      wid: SEED_WORKSPACE_ID,
      role: 'creator',
      isDemo: false,
      displayName: 'Real User',
      email: 'real@example.com',
    });
    const req = new Request('http://localhost:3000/api/v1/auth/reset-demo', {
      method: 'POST',
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
    const res = await resetDemoPost(req);
    expect(res.status).toBe(403);
  });

  it('allows demo persona to reset dataset and returns success', async () => {
    const token = createSessionToken({
      sub: SEED_USERS.PRIYA,
      wid: SEED_WORKSPACE_ID,
      role: 'reviewer',
      isDemo: true,
      displayName: 'Priya (Reviewer)',
      email: 'priya@brightway.example',
    });
    const req = new Request('http://localhost:3000/api/v1/auth/reset-demo', {
      method: 'POST',
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
    const res = await resetDemoPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('reset');
  });
});
