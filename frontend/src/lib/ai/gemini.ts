import { LLMProvider, AiCheckResult } from './types';
import { Finding } from '../engine/types';
import { serverEnv } from '../env';

export class GeminiProvider implements LLMProvider {
  public name = 'Google Gemini';
  public model = serverEnv.aiModel || 'gemini-1.5-flash';

  async checkContent(
    redactedText: string,
    rulesSummary: string,
    timeoutMs: number = 20000
  ): Promise<AiCheckResult> {
    const start = Date.now();
    const apiKey = serverEnv.aiApiKey;

    if (!apiKey) {
      return {
        findings: [],
        metrics: {
          provider: this.name,
          model: this.model,
          latencyMs: 0,
          status: 'error',
          errorDetail: 'AI_API_KEY is not configured.',
        },
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const systemInstruction = `You are the Inkloom Guardian brand compliance analyser.
Analyse the provided text strictly according to the approved rules:
${rulesSummary}

Return ONLY a JSON array of findings with shape:
[{"ruleKey": string, "category": string, "severity": string, "quote": string, "explanation": string, "suggestion": string, "confidence": number}]
Do not invent rules. Every quote MUST be an exact verbatim substring. If no issues found, return [].`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Text to evaluate:\n"""\n${redactedText}\n"""` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errorText = await res.text();
        return {
          findings: [],
          metrics: {
            provider: this.name,
            model: this.model,
            latencyMs,
            status: 'error',
            errorDetail: `Gemini API HTTP ${res.status}: ${errorText.slice(0, 300)}`,
          },
        };
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsed = JSON.parse(rawText);

      const findings: Finding[] = [];
      if (Array.isArray(parsed)) {
        for (let i = 0; i < parsed.length; i++) {
          const item = parsed[i];
          if (!item.quote || !item.ruleKey) continue;
          const idx = redactedText.indexOf(item.quote);
          if (idx !== -1) {
            findings.push({
              id: `ai-gemini-${Date.now()}-${i}`,
              ruleKey: item.ruleKey,
              ruleTitle: item.ruleKey,
              ruleSetVersion: 3,
              sourceDoc: 'Brand Guidelines',
              origin: 'ai',
              category: item.category || 'tone',
              severity: item.severity || 'minor',
              spanStart: idx,
              spanEnd: idx + item.quote.length,
              quote: item.quote,
              explanation: item.explanation || 'Identified by AI assistant',
              suggestion: item.suggestion,
              confidence: typeof item.confidence === 'number' ? item.confidence : 0.85,
              status: 'open',
            });
          }
        }
      }

      return {
        findings,
        metrics: {
          provider: this.name,
          model: this.model,
          latencyMs,
          inputTokens: json.usageMetadata?.promptTokenCount,
          outputTokens: json.usageMetadata?.candidatesTokenCount,
          status: 'ok',
          rawOutput: rawText,
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        findings: [],
        metrics: {
          provider: this.name,
          model: this.model,
          latencyMs: Date.now() - start,
          status: err.name === 'AbortError' ? 'timeout' : 'error',
          errorDetail: err.message || 'AI request failed.',
        },
      };
    }
  }
}
