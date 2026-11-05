import { LLMProvider, AiCheckResult } from './types';
import { Finding } from '../engine/types';

export class MockProvider implements LLMProvider {
  public name = 'demo AI (mock)';
  public model = 'mock-v1';

  async checkContent(
    redactedText: string,
    _rulesSummary: string,
    _timeoutMs: number = 20000
  ): Promise<AiCheckResult> {
    const start = Date.now();
    const findings: Finding[] = [];

    // Deterministic mock checks:
    // If text contains "revolutionary" or "game-changing"
    const hypeMatch = redactedText.match(/\b(revolutionary|game-changing)\b/i);
    if (hypeMatch && hypeMatch.index !== undefined) {
      findings.push({
        id: `ai-finding-tone-${hypeMatch.index}`,
        ruleKey: 'TONE-003',
        ruleTitle: 'Hype words',
        ruleSetVersion: 3,
        sourceDoc: 'Brand Voice Guide',
        sourceSection: '2.4',
        origin: 'ai',
        category: 'tone',
        severity: 'minor',
        spanStart: hypeMatch.index,
        spanEnd: hypeMatch.index + hypeMatch[0].length,
        quote: hypeMatch[0],
        explanation: 'AI detected overhyped marketing language that reduces credibility.',
        suggestion: 'innovative',
        confidence: 0.88,
        status: 'open',
      });
    }

    return {
      findings,
      metrics: {
        provider: this.name,
        model: this.model,
        latencyMs: Date.now() - start,
        inputTokens: Math.ceil(redactedText.length / 4),
        outputTokens: 45,
        status: 'ok',
        rawOutput: JSON.stringify(findings),
      },
    };
  }
}
