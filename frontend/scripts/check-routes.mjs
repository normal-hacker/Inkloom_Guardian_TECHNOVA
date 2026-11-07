#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function checkRoutes(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const sitemapPath = options.sitemapPath || (
    fs.existsSync(path.join(rootDir, '..', 'docs', 'SITEMAP.md'))
      ? path.join(rootDir, '..', 'docs', 'SITEMAP.md')
      : path.join(rootDir, 'docs', 'SITEMAP.md')
  );
  const appDir = options.appDir || path.join(rootDir, 'app');

  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`SITEMAP.md not found at ${sitemapPath}`);
  }

  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  // Parse Markdown table rows
  // First column: ID, second column: `route`, last column: status
  const routeRows = [];
  const lines = sitemapContent.split('\n');

  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    const cols = line.split('|').map((c) => c.trim()).filter((c, idx, arr) => {
      // Keep columns between outer | markers
      return idx > 0 && idx < arr.length - 1;
    });

    if (cols.length >= 4) {
      const id = cols[0];
      const rawRoute = cols[1];
      const status = cols[cols.length - 1].toLowerCase();

      // Check if it's a valid data row (e.g. id like P1, A1, etc. and route wrapped in backticks)
      const routeMatch = rawRoute.match(/^`([^`]+)`$/);
      if (routeMatch && /^[A-Z0-9]+$/i.test(id)) {
        let route = routeMatch[1].trim();
        if (route.includes('?')) {
          route = route.split('?')[0];
        }
        routeRows.push({ id, route, status });
      }
    }
  }

  const errors = [];
  const checked = [];

  for (const item of routeRows) {
    if (item.route === '/404' || item.route.startsWith('/api')) {
      continue;
    }

    // Determine expected file path in appDir
    let pagePath;
    if (item.route === '/') {
      pagePath = path.join(appDir, 'page.tsx');
    } else {
      const segs = item.route.replace(/^\//, '').split('/');
      pagePath = path.join(appDir, ...segs, 'page.tsx');
    }

    const exists = fs.existsSync(pagePath);
    checked.push({ ...item, pagePath, exists });

    if (item.status === 'done' && !exists) {
      errors.push(`Route ${item.route} marked 'done' in SITEMAP.md does not exist at ${pagePath}`);
    }
  }

  return { success: errors.length === 0, errors, checked, routeRows };
}

// CLI runner
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const res = checkRoutes();
    console.log(`✓ SITEMAP check inspected ${res.checked.length} mapped routes.`);
    if (res.errors.length > 0) {
      console.error('Route Check Errors:');
      res.errors.forEach((e) => console.error(`  ✖ ${e}`));
      process.exit(1);
    }
  } catch (err) {
    console.error(`✖ Error checking routes:`, err.message);
    process.exit(1);
  }
}
