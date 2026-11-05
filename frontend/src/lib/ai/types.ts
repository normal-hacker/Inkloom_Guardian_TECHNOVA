import { Finding } from '../engine/types';

export interface AiCallMetrics {
  provider: string;
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  status: 'ok' | 'timeout' | 'invalid_output' | 'error';
  rawOutput?: string;
  errorDetail?: string;
}

export interface AiCheckResult {
  findings: Finding[];
  metrics: AiCallMetrics;
}

export interface LLMProvider {
  name: string;
  model: string;
  checkContent(
    redactedText: string,
    rulesSummary: string,
    timeoutMs?: number
  ): Promise<AiCheckResult>;
}
