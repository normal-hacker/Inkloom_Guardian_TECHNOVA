import { describe, it, expect } from 'vitest';
import { runRules } from '../src/lib/engine/rules';
import { redact } from '../src/lib/engine/redact';

describe('Round 3 Feature C: Generalization & Quick-Check Engine', () => {
  it('redacts confidential codenames and PII before processing', () => {
    const raw = 'Please contact jane@brightway.com or call 555-123-4567 regarding Project Helios.';
    const { redactedText, segments } = redact(raw, ['Project Helios']);

    expect(redactedText).not.toContain('jane@brightway.com');
    expect(redactedText).not.toContain('555-123-4567');
    expect(redactedText).not.toContain('Project Helios');
    expect(segments.length).toBe(3);
  });

  it('runs deterministic checks on arbitrary copy and citations match', () => {
    const copy = 'We are the best solar installer and guarantee 40% savings on electric bills.';
    const findings = runRules(copy);

    const hasBest = findings.some((f) => f.ruleKey === 'CLAIM-001' && f.quote.toLowerCase() === 'best');
    const hasGuarantee = findings.some((f) => f.ruleKey === 'CLAIM-002');
    const hasNum = findings.some((f) => f.ruleKey === 'NUM-001');

    expect(hasBest).toBe(true);
    expect(hasGuarantee).toBe(true);
    expect(hasNum).toBe(true);

    // Invariant: text slice equals quote
    for (const f of findings) {
      expect(copy.slice(f.spanStart, f.spanEnd).toLowerCase()).toBe(f.quote.toLowerCase());
    }
  });

  it('evaluates arbitrary clean copy with zero false positives', () => {
    const cleanCopy = 'Brightway Solar installs residential photovoltaic panels with a 25-year panel warranty.';
    const findings = runRules(cleanCopy);
    const blockers = findings.filter((f) => f.severity === 'blocker');
    expect(blockers.length).toBe(0);
  });
});

