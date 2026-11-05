import { Finding } from './types';
import { deduplicateAndRankFindings } from './dedup';

const VALID_RULE_KEYS = new Set([
  'TONE-001',
  'TONE-002',
  'TONE-003',
  'TERM-001',
  'TERM-002',
  'MSG-001',
  'CLAIM-001',
  'CLAIM-002',
  'NUM-001',
  'CONF-001',
  'ACC-001',
  'ACC-002',
  'ACC-003',
]);

const BLOCKER_TRIGGERS = [
  /\b(best|#1|number one|fastest|leading|unbeatable|world-class|only)\b/i,
  /\b(guarantee|guaranteed|risk-free|100%)\b/i,
  /\b(Project Helios|unreleased|internal only|do not share)\b/i,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
];

/**
 * Validates AI-generated findings against grounded rules and text content.
 */
export function validateAiFindings(rawFindings: Finding[], text: string): Finding[] {
  const validated: Finding[] = [];

  for (const f of rawFindings) {
    // 1. Unknown rule key -> drop
    if (!VALID_RULE_KEYS.has(f.ruleKey)) {
      continue;
    }

    // 2. Offsets check & quote check
    if (f.spanStart < 0 || f.spanEnd > text.length || f.spanStart >= f.spanEnd) {
      continue;
    }

    const actual = text.slice(f.spanStart, f.spanEnd);
    if (actual !== f.quote) {
      continue;
    }

    // 3. Reject suggestion if it violates a blocker rule
    if (f.suggestion) {
      const violatesBlocker = BLOCKER_TRIGGERS.some((rgx) => rgx.test(f.suggestion || ''));
      if (violatesBlocker) {
        delete f.suggestion;
      }
    }

    // Set origin to ai
    f.origin = 'ai';
    validated.push(f);
  }

  return deduplicateAndRankFindings(validated, text, 50);
}
