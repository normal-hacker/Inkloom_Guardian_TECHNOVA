import { describe, expect, it } from 'vitest';

import { GET } from '../app/api/v1/health/route';
import { apiError } from '../src/lib/api/errors';

describe('health route', () => {
  it('returns the liveness response', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});

describe('API errors', () => {
  it('uses the documented error envelope and request id', async () => {
    const response = apiError(
      400,
      'bad_request',
      'Invalid request.',
      'request-123',
      {
        field: 'text',
      },
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('X-Request-ID')).toBe('request-123');
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'bad_request',
        message: 'Invalid request.',
        details: { field: 'text' },
        request_id: 'request-123',
      },
    });
  });
});
