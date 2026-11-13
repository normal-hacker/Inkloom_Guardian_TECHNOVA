import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git')) {
        results = results.concat(walk(fullPath));
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      // Exclude this test file itself
      if (!fullPath.endsWith('banned-phrases.test.ts')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

describe('Prompt 2 item 2.7: Banned marketing overclaim copy audit', () => {
  const rootDir = path.resolve(__dirname, '..');
  const sourceFiles = walk(rootDir);

  it('fails if any UI or code file contains "AI-powered"', () => {
    const violations: string[] = [];
    sourceFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      if (/AI-powered/i.test(content)) {
        violations.push(file);
      }
    });
    expect(violations, `Found "AI-powered" in files:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('fails if any UI or code file contains ungrounded "secure audit trail"', () => {
    const violations: string[] = [];
    sourceFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      if (/secure audit trail/i.test(content)) {
        violations.push(file);
      }
    });
    expect(violations, `Found "secure audit trail" in files:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('fails if any UI or code file claims "AI ensures compliance"', () => {
    const violations: string[] = [];
    sourceFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      if (/AI ensures compliance/i.test(content)) {
        violations.push(file);
      }
    });
    expect(violations, `Found "AI ensures compliance" in files:\n${violations.join('\n')}`).toHaveLength(0);
  });
});

