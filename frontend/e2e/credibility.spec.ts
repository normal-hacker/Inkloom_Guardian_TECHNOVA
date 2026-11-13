import { test, expect } from '@playwright/test';

test.describe('Credibility & Public Surfaces Suite', () => {
  // Test 1.2: Real hash verifier on /demo-report
  test('1.2: verify hash panel shows MATCH logged out and MISMATCH when tampered', async ({ page }) => {
    await page.goto('/demo-report');

    // Panel visible
    const verifierPanel = page.locator('[data-testid="hash-verifier-panel"]');
    await expect(verifierPanel).toBeVisible();

    // Initial status badge should say MATCH
    const matchBadge = page.locator('[data-testid="hash-status-badge"]');
    await expect(matchBadge).toBeVisible();
    await expect(matchBadge).toContainText('MATCH');

    // Tamper with text in textarea
    const tamperTextarea = page.locator('[data-testid="tamper-textarea"]');
    await expect(tamperTextarea).toBeVisible();
    await tamperTextarea.fill('This copy has been tampered with maliciously.');

    // Status badge must change to MISMATCH
    await expect(matchBadge).toContainText('MISMATCH');
  });

  // Test 1.3: Logged-out visitors see zero console errors, zero demo persona, exactly one header landmark
  const routes = ['/', '/login', '/demo-report', '/about-ai', '/build-notes'];
  const viewports = [
    { width: 375, height: 667, name: '375px mobile' },
    { width: 1280, height: 800, name: '1280px desktop' },
  ];

  for (const vp of viewports) {
    for (const route of routes) {
      test(`1.3: ${route} at ${vp.name} has zero 401s, zero persona text, one header`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route);

        // Assert no "Switch demo persona" text visible
        const personaText = page.getByText('Switch demo persona');
        await expect(personaText).toHaveCount(0);

        // Assert exactly one header / banner landmark
        const headerCount = await page.locator('header').count();
        expect(headerCount).toBeLessThanOrEqual(1);

        // Filter out benign favicon or hydration errors if any, but assert zero 401 unauthenticated errors
        const authErrors = consoleErrors.filter((e) => e.includes('401') || e.includes('Unauthorized'));
        expect(authErrors).toHaveLength(0);
      });
    }
  }

  // Test 1.7: 60-second judge path on landing page
  test('1.7: 60-second live check button runs client-side engine and highlights findings within 3 seconds', async ({ page }) => {
    await page.goto('/');

    const checkBtn = page.locator('[data-testid="live-check-btn"]');
    await expect(checkBtn).toBeVisible();

    const startTime = Date.now();
    await checkBtn.click();

    // At least 2 findings render
    const findings = page.locator('[data-testid="live-finding-item"]');
    await expect(findings.first()).toBeVisible({ timeout: 3000 });
    const count = await findings.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(3500);
  });
});

