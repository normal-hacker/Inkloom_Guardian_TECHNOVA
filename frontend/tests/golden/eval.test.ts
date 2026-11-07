import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { runRules } from '../../src/lib/engine';

interface GoldenCase {
  id: number;
  description: string;
  text: string;
  expected_rules: string[];
}

interface GoldenFile {
  cases: GoldenCase[];
}

describe('Stage S7 — Golden Set Evaluation (52 Labelled Texts)', () => {
  const filePath = path.resolve(__dirname, 'labels.yaml');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = YAML.parse(fileContent) as GoldenFile;

  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;

  const caseResults: Array<{
    id: number;
    description: string;
    detected: string[];
    expected: string[];
    tp: number;
    fp: number;
    fn: number;
  }> = [];

  parsed.cases.forEach((c) => {
    it(`Case ${c.id}: ${c.description}`, () => {
      const findings = runRules(c.text);
      const detected = Array.from(new Set(findings.map((f) => f.ruleKey)));
      const expected = c.expected_rules;

      const tp = detected.filter((r) => expected.includes(r)).length;
      const fp = detected.filter((r) => !expected.includes(r)).length;
      const fn = expected.filter((r) => !detected.includes(r)).length;

      totalTP += tp;
      totalFP += fp;
      totalFN += fn;

      caseResults.push({
        id: c.id,
        description: c.description,
        detected,
        expected,
        tp,
        fp,
        fn,
      });

      // Individual case assertions
      expected.forEach((rule) => {
        expect(detected, `Case ${c.id} should detect rule ${rule}`).toContain(rule);
      });
      if (expected.length === 0) {
        expect(detected, `Case ${c.id} should have zero findings`).toHaveLength(0);
      }
    });
  });

  it('Overall Benchmark: Precision >= 90% and Recall >= 90%', () => {
    const precision = totalTP + totalFP === 0 ? 1 : totalTP / (totalTP + totalFP);
    const recall = totalTP + totalFN === 0 ? 1 : totalTP / (totalTP + totalFN);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    // Formatted evaluation log
    console.log('\n================ GOLDEN SET BENCHMARK RESULTS ================');
    console.log(`Total Cases:     ${parsed.cases.length}`);
    console.log(`True Positives:  ${totalTP}`);
    console.log(`False Positives: ${totalFP}`);
    console.log(`False Negatives: ${totalFN}`);
    console.log(`Precision:       ${(precision * 100).toFixed(2)}% (Target >= 90%)`);
    console.log(`Recall:          ${(recall * 100).toFixed(2)}% (Target >= 90%)`);
    console.log(`F1-Score:        ${(f1 * 100).toFixed(2)}%`);
    console.log('==============================================================\n');

    expect(precision).toBeGreaterThanOrEqual(0.9);
    expect(recall).toBeGreaterThanOrEqual(0.9);
  });
});

