import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import YAML from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import runRules from built engine or compile via tsx/node
import { runRules } from './src/lib/engine/rules.js';

function evaluateSet(labelsPath) {
  const content = fs.readFileSync(labelsPath, 'utf-8');
  const parsed = YAML.parse(content);
  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;

  for (const c of parsed.cases) {
    const findings = runRules(c.text);
    const detected = Array.from(new Set(findings.map((f) => f.ruleKey)));
    const expected = c.expected_rules || [];

    const tp = detected.filter((r) => expected.includes(r)).length;
    const fp = detected.filter((r) => !expected.includes(r)).length;
    const fn = expected.filter((r) => !detected.includes(r)).length;

    totalTP += tp;
    totalFP += fp;
    totalFN += fn;
  }

  const precision = totalTP + totalFP > 0 ? (totalTP / (totalTP + totalFP)) * 100 : 0;
  const recall = totalTP + totalFN > 0 ? (totalTP / (totalTP + totalFN)) * 100 : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    totalCases: parsed.cases.length,
    truePositives: totalTP,
    falsePositives: totalFP,
    falseNegatives: totalFN,
    precisionPct: Number(precision.toFixed(2)),
    recallPct: Number(recall.toFixed(2)),
    f1ScorePct: Number(f1.toFixed(2)),
  };
}

let commitHash = 'main';
try {
  commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch (e) {
  commitHash = 'unknown';
}

const goldenPath = path.resolve(__dirname, 'tests/golden/labels.yaml');
const holdoutPath = path.resolve(__dirname, 'tests/holdout/labels.yaml');

const goldenResults = evaluateSet(goldenPath);
const holdoutResults = evaluateSet(holdoutPath);

const output = {
  generatedAt: new Date().toISOString(),
  commitHash,
  goldenSet: goldenResults,
  holdoutSet: holdoutResults,
};

const outputPath = path.resolve(__dirname, 'public/benchmark-results.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log('Generated benchmark results at:', outputPath);
console.log(JSON.stringify(output, null, 2));

