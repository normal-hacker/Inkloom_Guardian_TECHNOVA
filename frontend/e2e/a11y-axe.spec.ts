import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const axeScript = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const publicPages = [
  { path: '/', name: 'Landing Homepage' },
  { path: '/login', name: 'Login Screen' },
  { path: '/demo-report', name: 'Demo Report' },
  { path: '/benchmark', name: 'Benchmark Telemetry' },
  { path: '/rules', name: 'Rules Directory' },
  { path: '/about-ai', name: 'About AI' },
];

test.describe('Phase 6.2: Axe Accessibility Audit on Public Routes', () => {
  for (const p of publicPages) {
    test(`axe audit on ${p.name} (${p.path}) has 0 serious or critical violations`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('domcontentloaded');

      // Inject axe-core
      await page.evaluate(axeScript);

      // Run axe evaluation
      const results = await page.evaluate(async () => {
        // @ts-expect-error window.axe injected at runtime
        return await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa'],
          },
        });
      });

      // Filter to serious or critical violations
      const severeViolations = results.violations.filter(
        (v: any) => v.impact === 'serious' || v.impact === 'critical'
      );

      if (severeViolations.length > 0) {
        console.error(`Axe violations on ${p.path}:`, JSON.stringify(severeViolations, null, 2));
      }

      expect(
        severeViolations,
        `Expected 0 serious/critical axe violations on ${p.path}, found ${severeViolations.length}`
      ).toHaveLength(0);
    });
  }
});
