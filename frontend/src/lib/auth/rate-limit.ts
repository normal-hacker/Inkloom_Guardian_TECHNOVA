interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipLimits = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter
 * @param ip Client IP address
 * @param maxRequests Maximum requests allowed within window
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, resetAt: number, retryAfterSeconds: number }
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  retryAfter: number;
} {
  const now = Date.now();
  const existing = ipLimits.get(ip);

  if (!existing || now > existing.resetAt) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    ipLimits.set(ip, record);
    const retrySec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: record.resetAt,
      retryAfterSeconds: retrySec,
      retryAfter: retrySec,
    };
  }

  const retrySec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: retrySec,
      retryAfter: retrySec,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: retrySec,
    retryAfter: retrySec,
  };
}

export function resetRateLimit(ip: string): void {
  ipLimits.delete(ip);
}

