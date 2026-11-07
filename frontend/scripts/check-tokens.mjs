#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function checkTokens(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const targetDirs = options.targetDirs || [
    path.join(rootDir, 'app'),
    path.join(rootDir, 'components'),
  ];

  const errors = [];
  const filesChecked = [];

  const rawHexRegex = /#([0-9a-fA-F]{3,8})\b/g;
  // Match arbitrary pixel layout dimensions like w-[283px], h-[350px], top-[14px], etc.
  const arbitraryPxRegex = /\b(w|h|min-w|max-w|min-h|max-h|p|px|py|pl|pr|pt|pb|m|mx|my|ml|mr|mt|mb|top|bottom|left|right)-\[(\d+)px\]/g;

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
        if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
          checkFile(fullPath);
        }
      }
    }
  }

  function checkFile(filePath) {
    if (
      filePath.includes('.test.') ||
      filePath.includes('.spec.') ||
      filePath.includes('tokens.css') ||
      filePath.includes('tailwind.config.') ||
      filePath.includes('styleguide') ||
      filePath.includes('sign-up.tsx') // auth glass component exemption per FRAMEWORK_PROMPT §5
    ) {
      return;
    }

    filesChecked.push(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('token-check-ignore') || line.includes('/* token-check-ignore */')) {
        return;
      }

      // Check for raw hex colors in code
      const hexMatches = line.match(rawHexRegex);
      if (hexMatches) {
        for (const hex of hexMatches) {
          if (!line.trim().startsWith('//') && !line.includes('href="#') && !line.includes('#main')) {
            if (
              line.includes(`'${hex}'`) ||
              line.includes(`"${hex}"`) ||
              line.includes(`\`${hex}\``) ||
              line.includes(`[${hex}]`)
            ) {
              errors.push({
                file: path.relative(rootDir, filePath),
                line: index + 1,
                issue: `Raw hex colour '${hex}' found. Use CSS variable or token instead.`,
              });
            }
          }
        }
      }

      // Check for arbitrary pixel dimensions (excluding standardized 44px touch targets and layout specs)
      const pxMatches = line.match(arbitraryPxRegex);
      if (pxMatches) {
        for (const cls of pxMatches) {
          if (
            !cls.includes('44px') &&
            !cls.includes('52px') &&
            !cls.includes('280px') &&
            !cls.includes('320px') &&
            !cls.includes('1280px')
          ) {
            errors.push({
              file: path.relative(rootDir, filePath),
              line: index + 1,
              issue: `Arbitrary pixel class '${cls}' found. Use design token scale or standard token instead.`,
            });
          }
        }
      }
    });
  }

  targetDirs.forEach((dir) => walk(dir));

  return { success: errors.length === 0, errors, filesChecked };
}

// CLI runner
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const res = checkTokens();
    console.log(`✓ Token check scanned ${res.filesChecked.length} files.`);
    if (res.errors.length > 0) {
      console.error(`✖ Token Check Errors (${res.errors.length}):`);
      res.errors.slice(0, 10).forEach((e) => console.error(`  ${e.file}:${e.line} - ${e.issue}`));
      if (res.errors.length > 10) {
        console.error(`  ...and ${res.errors.length - 10} more`);
      }
      process.exit(1);
    } else {
      console.log('✓ Zero raw hex colors or arbitrary pixel classes detected in feature code.');
    }
  } catch (err) {
    console.error(`✖ Error checking tokens:`, err.message);
    process.exit(1);
  }
}
