#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const RESTRICTED_DOMAIN_TYPES = [
  'Finding',
  'FindingView',
  'ContentItem',
  'ContentVersion',
  'ReviewRun',
  'Rule',
  'RuleSet',
  'Approval',
  'AuditEntry',
  'User',
];

export function checkTypes(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const targetDirs = options.targetDirs || [
    path.join(rootDir, 'app'),
    path.join(rootDir, 'components'),
    path.join(rootDir, 'src', 'lib'),
  ];

  const allowedPath = path.resolve(rootDir, 'src', 'lib', 'domain', 'types.ts');
  const errors = [];
  const filesChecked = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (['.ts', '.tsx'].includes(ext)) {
          checkFile(fullPath);
        }
      }
    }
  }

  function checkFile(filePath) {
    // Exempt tests, mocks, and domain/types.ts
    const resolved = path.resolve(filePath);
    if (resolved === allowedPath || filePath.includes('.test.') || filePath.includes('.spec.')) {
      return;
    }

    filesChecked.push(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    for (const typeName of RESTRICTED_DOMAIN_TYPES) {
      // Look for `export interface TypeName`, `interface TypeName`, `export type TypeName =`, `type TypeName =`
      const declRegex = new RegExp(`\\b(export\\s+)?(interface|type)\\s+${typeName}\\b\\s*(=|\\{)`, 'g');
      if (declRegex.test(content)) {
        errors.push({
          file: path.relative(rootDir, filePath),
          typeName,
          issue: `Found local declaration of domain type '${typeName}'. Import from '@/lib/domain/types' instead.`,
        });
      }
    }
  }

  targetDirs.forEach((dir) => walk(dir));

  return { success: errors.length === 0, errors, filesChecked };
}

// CLI runner
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const res = checkTypes();
    console.log(`✓ Domain type check scanned ${res.filesChecked.length} files.`);
    if (res.errors.length > 0) {
      console.error(`✖ Domain Type Check Errors (${res.errors.length}):`);
      res.errors.forEach((e) => console.error(`  ${e.file}: ${e.issue}`));
      process.exit(1);
    } else {
      console.log('✓ Zero local domain type re-declarations detected.');
    }
  } catch (err) {
    console.error(`✖ Error checking types:`, err.message);
    process.exit(1);
  }
}

