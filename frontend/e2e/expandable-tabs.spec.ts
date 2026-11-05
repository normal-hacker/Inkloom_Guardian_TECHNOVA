import { test, expect } from '@playwright/test';

test.describe('ExpandableTabs & Navigation E2E Suite (§8 Acceptance)', () => {
  test('1. Creator persona: Click visible tabs updates route, expands active tab and updates PageHeader', async ({ page }) => {
    // Demo login as Creator
    await page.goto('/login');
    const ashaBtn = page.getByTestId('demo-creator-asha');
    if (await ashaBtn.isVisible()) {
      await ashaBtn.click();
      await page.waitForURL('**/dashboard');
    } else {
      await page.goto('/dashboard');
    }

    // Verify Dashboard is active
    const navBar = page.getByRole('navigation', { name: /main navigation/i });
    await expect(navBar).toBeVisible();

    // Click Guidelines tab
    const guidelinesTab = navBar.getByRole('link', { name: /guidelines/i });
    await guidelinesTab.click();
    await page.waitForURL('**/guidelines');

    // Guidelines pill label expanded
    await expect(guidelinesTab).toContainText('Guidelines');
    // PageHeader updated
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/brand guidelines/i);

    // Verify creator does NOT see Insights or Audit
    await expect(navBar.getByRole('link', { name: /insights/i })).toHaveCount(0);
    await expect(navBar.getByRole('link', { name: /audit/i })).toHaveCount(0);
  });

  test('2. Blank page click does not collapse active navigation pill', async ({ page }) => {
    await page.goto('/dashboard');

    const navBar = page.getByRole('navigation', { name: /main navigation/i });
    const dashLink = navBar.getByRole('link', { name: /dashboard/i });

    // Active pill contains text 'Dashboard'
    await expect(dashLink).toContainText('Dashboard');

    // Click blank area in body
    await page.locator('body').click({ position: { x: 50, y: 300 } });

    // Active pill STILL keeps its label
    await expect(dashLink).toContainText('Dashboard');
  });

  test('3. Reload on /guidelines?tab=facts selects Facts tab and expands label', async ({ page }) => {
    await page.goto('/guidelines?tab=facts');

    // Facts tab should be active and expanded
    const factsTab = page.getByRole('tab', { name: /facts/i });
    await expect(factsTab).toBeVisible();
    await expect(factsTab).toHaveAttribute('aria-selected', 'true');
    await expect(factsTab).toContainText('Facts');

    // The Facts panel is displayed
    await expect(page.getByText(/Approved Metrics Sheet 2025-Q3/i)).toBeVisible();
  });

  test('4. Reviewer persona sees Insights and Audit in ExpandableTabs', async ({ page }) => {
    // Login as Reviewer Priya
    await page.context().clearCookies();
    await page.goto('/login');
    const priyaBtn = page.getByTestId('demo-reviewer-priya');
    if (await priyaBtn.isVisible()) {
      await priyaBtn.click();
      await page.waitForURL('**/dashboard');
    } else {
      await page.goto('/dashboard');
    }

    const navBar = page.getByRole('navigation', { name: /main navigation/i });
    const insightsLink = navBar.getByRole('link', { name: /insights/i });
    const auditLink = navBar.getByRole('link', { name: /audit/i });

    await expect(insightsLink).toBeVisible();
    await expect(auditLink).toBeVisible();

    // Click Insights
    await insightsLink.click();
    await page.waitForURL('**/insights');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/insights/i);
  });

  test('5. Rapid clicking across tabs leaves exactly one pill expanded with no stuck state', async ({ page }) => {
    await page.goto('/guidelines');

    const tabsContainer = page.getByRole('tablist', { name: /guidelines sections/i });
    const tabs = tabsContainer.getByRole('tab');
    const tabCount = await tabs.count();

    // Rapid click across tabs 10 times
    for (let i = 0; i < 10; i++) {
      const target = tabs.nth(i % tabCount);
      await target.click();
    }

    // Exactly one tab should have aria-selected="true"
    const selectedTabs = tabsContainer.locator('[aria-selected="true"]');
    await expect(selectedTabs).toHaveCount(1);
  });

  test('6. Mobile 360px viewport: horizontal navigation and no page layout shift', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/dashboard');

    const navBar = page.getByRole('navigation', { name: /main navigation/i });
    await expect(navBar).toBeVisible();

    // Verify page has no horizontal window overflow (window.scrollWidth <= window.innerWidth)
    const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(isOverflowing).toBe(false);

    // Save screenshot
    await page.screenshot({ path: 'tests/screenshots/dashboard-mobile-360px.png' });
  });

  test('7. Desktop 1280px viewport screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');

    await page.screenshot({ path: 'tests/screenshots/dashboard-desktop-1280px.png' });
  });
});

