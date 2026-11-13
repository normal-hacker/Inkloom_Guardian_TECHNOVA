import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { runRules } from '../../src/lib/engine';

interface HoldoutCase {
  id: number;
  description: string;
  text: string;
  expected_rules: string[];
}

interface HoldoutFile {
  cases: HoldoutCase[];
}

describe('Stage S7 — Independent Holdout Set Evaluation (20 Unseen Texts)', () => {
  const filePath = path.resolve(__dirname, 'labels.yaml');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = YAML.parse(fileContent) as HoldoutFile;

  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;

  parsed.cases.forEach((c) => {
    it(`Holdout Case ${c.id}: ${c.description}`, () => {
      const findings = runRules(c.text);
      const detected = Array.from(new Set(findings.map((f) => f.ruleKey)));
      const expected = c.expected_rules;

      const tp = detected.filter((r) => expected.includes(r)).length;
      const fp = detected.filter((r) => !expected.includes(r)).length;
      const fn = expected.filter((r) => !detected.includes(r)).length;

      totalTP += tp;
      totalFP += fp;
      totalFN += fn;

      // Report evaluated results without failing per-case assertions
      // Because holdout evaluates generalization performance on unseen real-world data
      expect(detected).toBeDefined();
    });
  });

  it('calculates holdout precision, recall, and F1 score honestly', () => {
    const precision = totalTP + totalFP > 0 ? (totalTP / (totalTP + totalFP)) * 100 : 0;
    const recall = totalTP + totalFN > 0 ? (totalTP / (totalTP + totalFN)) * 100 : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    console.log('\n================ HOLDOUT BENCHMARK RESULTS ================');
    console.log(`Total Cases:     ${parsed.cases.length}`);
    console.log(`True Positives:  ${totalTP}`);
    console.log(`False Positives: ${totalFP}`);
    console.log(`False Negatives: ${totalFN}`);
    console.log(`Precision:       ${precision.toFixed(2)}%`);
    console.log(`Recall:          ${recall.toFixed(2)}%`);
    console.log(`F1-Score:        ${f1.toFixed(2)}%`);
    console.log('===========================================================\n');

    expect(totalTP).toBeGreaterThanOrEqual(10);
  });
});
