import { LLMProvider } from './types';
import { MockProvider } from './mock';
import { GeminiProvider } from './gemini';
import { serverEnv } from '../env';

export * from './types';
export * from './mock';
export * from './gemini';

let consecutiveFailures = 0;
const MAX_FAILURES_BEFORE_CIRCUIT_BREAK = 3;

export function getAiProvider(): LLMProvider {
  const providerType = serverEnv.aiProvider.toLowerCase();

  // If circuit breaker is tripped, fall back to mock
  if (consecutiveFailures >= MAX_FAILURES_BEFORE_CIRCUIT_BREAK) {
    return new MockProvider();
  }

  if (providerType === 'gemini') {
    return new GeminiProvider();
  }

  return new MockProvider();
}

export function recordAiSuccess(): void {
  consecutiveFailures = 0;
}

export function recordAiFailure(): void {
  consecutiveFailures++;
}

export function resetCircuitBreaker(): void {
  consecutiveFailures = 0;
}
