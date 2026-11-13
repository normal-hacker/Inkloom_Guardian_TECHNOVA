import { describe, it, expect } from 'vitest';
import { CANONICAL_RULES, CANONICAL_FACTS, CANONICAL_SEVERITIES, F001_BENCHMARK } from '../src/lib/engine/constants';
import { runRules } from '../src/lib/engine';
import { DEFAULT_FACTS } from '../src/lib/engine/num001';
import fs from 'node:fs';
import path from 'node:path';

describe('1.1 & 1.5 Single Source of Truth & Rule Consistency Suite', () => {
  it('1.1: CANONICAL_SEVERITIES enforces NUM-001 = blocker and CLAIM-001 = blocker', () => {
    expect(CANONICAL_SEVERITIES['NUM-001']).toBe('blocker');
    expect(CANONICAL_SEVERITIES['CLAIM-001']).toBe('blocker');
  });

  it('1.1: F-001 benchmark values match certified customer study range 18-24% and benchmark 20%', () => {
    expect(F001_BENCHMARK.key).toBe('F-001');
    expect(F001_BENCHMARK.certifiedBenchmark).toBe('20%');
    expect(F001_BENCHMARK.certifiedRange).toBe('18–24%');
    expect(F001_BENCHMARK.certifiedMin).toBe(18);
    expect(F001_BENCHMARK.certifiedMax).toBe(24);
  });

  it('1.5: Rendered rule count === rules in engine === 13 and fact count === 6', () => {
    expect(CANONICAL_RULES.length).toBe(13);
    expect(CANONICAL_FACTS.length).toBe(6);
    expect(DEFAULT_FACTS.length).toBe(6);

    const factKeys = CANONICAL_FACTS.map((f) => f.key);
    expect(factKeys).toEqual(['F-001', 'F-002', 'F-003', 'F-004', 'F-005', 'F-006']);

    const ruleKeys = CANONICAL_RULES.map((r) => r.key);
    expect(ruleKeys).toContain('NUM-001');
    expect(ruleKeys).toContain('CLAIM-001');
    expect(ruleKeys).toContain('CLAIM-002');
    expect(ruleKeys).toContain('CONF-001');
    expect(ruleKeys).toContain('TERM-001');
    expect(ruleKeys).toContain('TERM-002');
  });

  it('1.1: Landing page source code does not contain hardcoded "up to 25%" or "major" for NUM-001', () => {
    const landingPath = path.resolve(__dirname, '../app/page.tsx');
    const content = fs.readFileSync(landingPath, 'utf-8');

    expect(content).not.toContain('"up to 25%"');
    expect(content).not.toContain('severity: \'major\',');
    expect(content).toContain('F001_BENCHMARK');
    expect(content).toContain('CANONICAL_SEVERITIES');
  });

  it('1.1: Demo report page does not contain hardcoded SHA-256 test vector "ba7816bf..."', () => {
    const demoReportPath = path.resolve(__dirname, '../app/demo-report/page.tsx');
    const content = fs.readFileSync(demoReportPath, 'utf-8');

    // Test vector SHA-256("abc") should never be hardcoded
    expect(content).not.toContain('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(content).toContain('crypto.subtle.digest');
  });

  it('1.9: Engine flags an unapproved 30-year warranty as a NUM-001 blocker', () => {
    const text = 'Brightway Solar provides an industry-leading 30-year warranty on all rooftop modules.';
    const findings = runRules(text);

    const warrantyFinding = findings.find((f) => f.ruleKey === 'NUM-001' && f.quote.includes('30-year'));
    expect(warrantyFinding).toBeDefined();
    expect(warrantyFinding?.severity).toBe('blocker');
    expect(warrantyFinding?.explanation).toContain('F-002');
  });

  it('1.4: Grep test fails if any page claims Gemini checks content without optional/advisory qualifier', () => {
    const pagesToCheck = [
      path.resolve(__dirname, '../app/page.tsx'),
      path.resolve(__dirname, '../app/about-ai/page.tsx'),
      path.resolve(__dirname, '../app/build-notes/page.tsx'),
    ];

    pagesToCheck.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lower = content.toLowerCase();
      if (lower.includes('gemini')) {
        const containsQualifier = lower.includes('optional') || lower.includes('advisory');
        expect(containsQualifier, `File ${filePath} mentions Gemini without optional/advisory qualifier`).toBe(true);
      }
    });
  });

  it('1.9: Approved 25-year panel warranty is accepted without blocker', () => {
    const text = 'Enjoy clean solar power and a 25-year panel warranty.';
    const findings = runRules(text);

    const blocker = findings.find((f) => f.ruleKey === 'NUM-001' && f.quote.includes('25-year'));
    expect(blocker).toBeUndefined();
  });
});
