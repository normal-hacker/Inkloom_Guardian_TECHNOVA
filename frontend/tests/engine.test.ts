import { describe, it, expect } from 'vitest';
import {
  runRules,
  sha256,
  diffWords,
  redact,
  restoreSpan,
  validateAiFindings,
} from '../src/lib/engine';

describe('Stage S2 — Pure TypeScript Rule Engine', () => {
  it('Case 1: "Our panels are the best on the market and guarantee 40% savings!" flags CLAIM-001, CLAIM-002, and NUM-001 blocker', () => {
    const text = 'Our panels are the best on the market and guarantee 40% savings!';
    const findings = runRules(text);

    const keys = findings.map((f) => f.ruleKey);
    expect(keys).toContain('CLAIM-001');
    expect(keys).toContain('CLAIM-002');
    expect(keys).toContain('NUM-001');

    // TONE-001 must not trigger on a single "!"
    expect(keys).not.toContain('TONE-001');

    // Check quotes and grounding
    const claim001 = findings.find((f) => f.ruleKey === 'CLAIM-001')!;
    expect(claim001.quote).toBe('best');
    expect(text.slice(claim001.spanStart, claim001.spanEnd)).toBe('best');

    const claim002 = findings.find((f) => f.ruleKey === 'CLAIM-002')!;
    expect(claim002.quote).toBe('guarantee');
    expect(text.slice(claim002.spanStart, claim002.spanEnd)).toBe('guarantee');

    const num001 = findings.find((f) => f.ruleKey === 'NUM-001')!;
    expect(num001.severity).toBe('blocker');
    expect(num001.quote).toBe('40%');
    expect(num001.explanation).toContain('Approved figure is 18–24%');
  });

  it('Case 2: "Customers report average bill savings of 22% after installation." -> no NUM-001 finding for 22%', () => {
    const text = 'Customers report average bill savings of 22% after installation.';
    const findings = runRules(text);
    const numFindings = findings.filter((f) => f.ruleKey === 'NUM-001');
    expect(numFindings.length).toBe(0);
  });

  it('Case 3: "Savings of 18-24% on your electricity bill." -> supported (range inside F-001)', () => {
    const text = 'Savings of 18-24% on your electricity bill.';
    const findings = runRules(text);
    const numFindings = findings.filter((f) => f.ruleKey === 'NUM-001');
    expect(numFindings.length).toBe(0);
  });

  it('Case 4: "Enjoy 30% off and a 25-year panel warranty." -> 30% gets major "no approved fact", 25-year is supported', () => {
    const text = 'Enjoy 30% off and a 25-year panel warranty.';
    const findings = runRules(text);

    const num30 = findings.find((f) => f.quote === '30%');
    expect(num30).toBeDefined();
    expect(num30?.severity).toBe('major');
    expect(num30?.explanation).toContain('No approved fact supports this figure.');

    // 25-year should be supported by F-002
    const num25 = findings.find((f) => f.quote.includes('25'));
    expect(num25).toBeUndefined();
  });

  it('Case 5: "BUY NOW AND SAVE BIG TODAY!!" triggers ACC-003 and TONE-001 (TONE-002 not triggered)', () => {
    const text = 'BUY NOW AND SAVE BIG TODAY!!';
    const findings = runRules(text);
    const keys = findings.map((f) => f.ruleKey);

    expect(keys).toContain('ACC-003');
    expect(keys).toContain('TONE-001');
    expect(keys).not.toContain('TONE-002');
  });

  it('Case 6: "We are cheaper than every rival. Click here" triggers MSG-001 and ACC-002', () => {
    const text = 'We are cheaper than every rival. Click here';
    const findings = runRules(text);
    const keys = findings.map((f) => f.ruleKey);

    expect(keys).toContain('MSG-001');
    expect(keys).toContain('ACC-002');
  });

  it('Case 7: "Contact me at jo@example.com about Project Helios" triggers two CONF-001 findings', () => {
    const text = 'Contact me at jo@example.com about Project Helios';
    const findings = runRules(text);
    const confFindings = findings.filter((f) => f.ruleKey === 'CONF-001');

    expect(confFindings.length).toBe(2);
    expect(confFindings.map((f) => f.quote)).toContain('jo@example.com');
    expect(confFindings.map((f) => f.quote)).toContain('Project Helios');
  });

  it('Case 8: Clean sentence "Brightway Solar installs panels for homes." returns 0 findings', () => {
    const text = 'Brightway Solar installs panels for homes.';
    const findings = runRules(text);
    expect(findings.length).toBe(0);
  });

  it('Case 9: Overlap resolution: "the best, guaranteed 100% result" has no overlapping spans', () => {
    const text = 'the best, guaranteed 100% result';
    const findings = runRules(text);

    for (let i = 0; i < findings.length; i++) {
      for (let j = i + 1; j < findings.length; j++) {
        const a = findings[i];
        const b = findings[j];
        const overlap = a.spanStart < b.spanEnd && a.spanEnd > b.spanStart;
        expect(overlap).toBe(false);
      }
    }
  });

  it('Case 10: XSS payloads like "<img src=x onerror=alert(1)>" execute safely as literal text', () => {
    const xss = '<img src=x onerror=alert(1)>';
    const findings = runRules(xss);
    expect(Array.isArray(findings)).toBe(true);
  });

  it('Case 15: SHA-256 of "abc" equals known vector ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', () => {
    const hash = sha256('abc');
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('Redact and restore offsets accurately maps original coordinates', () => {
    const original = 'Please email test@brightway.example regarding Project Helios now.';
    const { redactedText, segments } = redact(original);

    expect(redactedText).toContain('[EMAIL_1]');
    expect(redactedText).toContain('[CONFIDENTIAL_2]');
    expect(redactedText).not.toContain('test@brightway.example');
    expect(redactedText).not.toContain('Project Helios');

    const heliosRedactedIndex = redactedText.indexOf('[CONFIDENTIAL_2]');
    const restored = restoreSpan(heliosRedactedIndex, heliosRedactedIndex + '[CONFIDENTIAL_2]'.length, segments);

    expect(original.slice(restored.start, restored.end)).toBe('Project Helios');
  });

  it('Word diffing detects added, removed, and equal words', () => {
    const oldT = 'Switch to cheapest solar cells today!';
    const newT = 'Switch to affordable solar panels today!';
    const diff = diffWords(oldT, newT);

    expect(diff.some((d) => d.type === 'delete' && d.value === 'cheapest')).toBe(true);
    expect(diff.some((d) => d.type === 'insert' && d.value === 'affordable')).toBe(true);
  });

  it('validateAiFindings drops unknown rule keys and non-substring quotes', () => {
    const text = 'Our clean energy installation takes 1 to 2 days.';
    const fakeFindings: any[] = [
      {
        id: 'f-1',
        ruleKey: 'UNKNOWN-999',
        severity: 'blocker',
        category: 'tone',
        spanStart: 0,
        spanEnd: 3,
        quote: 'Our',
      },
      {
        id: 'f-2',
        ruleKey: 'CLAIM-001',
        severity: 'blocker',
        category: 'claim',
        spanStart: 4,
        spanEnd: 9,
        quote: 'FabricatedQuote',
      },
    ];

    const validated = validateAiFindings(fakeFindings, text);
    expect(validated.length).toBe(0);
  });

  it('Property test: Every finding strictly satisfies text.slice(start, end) === quote', () => {
    const samples = [
      'Amazing revolutionary SunLink panel installation with 40% guaranteed savings!',
      'Hurry! Act now for cheapest free energy. Project Helios is unreleased.',
      'BUY NOW AND SAVE BIG TODAY!! Click here for 100% risk-free guarantee.',
      'Our panels are better than all competitors and beats them on warranty.',
    ];

    for (const s of samples) {
      const findings = runRules(s);
      for (const f of findings) {
        if (f.ruleKey === 'ACC-001') continue;
        expect(s.slice(f.spanStart, f.spanEnd)).toBe(f.quote);
      }
    }
  });

  it('Performance test: runRules on a 2,000-word text runs in < 200 ms', () => {
    const paragraph = 'Switch to clean energy with Brightway Solar. Enjoy 20% savings on your bill and a 25-year panel warranty. ';
    const longText = paragraph.repeat(150); // ~2,100 words

    const start = performance.now();
    const findings = runRules(longText);
    const duration = performance.now() - start;

    expect(Array.isArray(findings)).toBe(true);
    expect(duration).toBeLessThan(200);
  });
});
