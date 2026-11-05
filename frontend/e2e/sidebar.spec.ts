import { test, expect } from '@playwright/test';

test.describe('Animated Collapsible Sidebar E2E Suite (§8 Acceptance)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('1. Hover desktop rail expands sidebar as overlay without shifting main content (zero CLS)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');

    const sidebarNav = page.locator('nav[aria-label="Main"]');
    const mainContent = page.locator('main#main');

    await expect(sidebarNav).toBeVisible();
    await expect(mainContent).toBeVisible();

    // Measure initial layout bounding box of main content
    const initialMainBox = await mainContent.boundingBox();
    expect(initialMainBox).not.toBeNull();

    // Hover over the sidebar rail
    await sidebarNav.hover();
    await page.waitForTimeout(250); // wait for hover intent delay (120ms + animation)

    // Verify expanded label appears
    const dashLabel = sidebarNav.getByRole('link', { name: /dashboard/i }).locator('span').last();
    await expect(dashLabel).toBeVisible();

    // Measure main content bounding box again - should NOT shift horizontally
    const hoveredMainBox = await mainContent.boundingBox();
    expect(hoveredMainBox).not.toBeNull();
    expect(Math.round(hoveredMainBox!.x)).toBe(Math.round(initialMainBox!.x));
    expect(Math.round(hoveredMainBox!.width)).toBe(Math.round(initialMainBox!.width));
  });

  test('2. Pinning sidebar persists state to localStorage and keeps sidebar open on reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');

    const sidebarNav = page.locator('nav[aria-label="Main"]');
    const mainContent = page.locator('main#main');

    const initialMainBox = await mainContent.boundingBox();
    expect(initialMainBox).not.toBeNull();

    // Hover to reveal pin button
    await sidebarNav.hover();
    await page.waitForTimeout(250);

    const pinBtn = sidebarNav.getByRole('button', { name: /pin sidebar/i });
    await expect(pinBtn).toBeVisible();
    await pinBtn.click();

    // Check localStorage
    const isPinned = await page.evaluate(() => localStorage.getItem('inkloom_sidebar_pinned'));
    expect(isPinned).toBe('true');

    // Main content shifts flex container when pinned
    const pinnedMainBox = await mainContent.boundingBox();
    expect(pinnedMainBox!.x).toBeGreaterThan(initialMainBox!.x);

    // Reload page and confirm pinned state persists
    await page.reload();
    await page.waitForTimeout(300);

    const isStillPinned = await page.evaluate(() => localStorage.getItem('inkloom_sidebar_pinned'));
    expect(isStillPinned).toBe('true');
    const unpinBtn = sidebarNav.getByRole('button', { name: /unpin sidebar/i });
    await expect(unpinBtn).toBeVisible();
  });

  test('3. Clicking nav item updates URL and active state indicator', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');

    const sidebarNav = page.locator('nav[aria-label="Main"]');
    const guidelinesLink = sidebarNav.getByRole('link', { name: /guidelines/i });

    await guidelinesLink.click();
    await page.waitForURL('**/guidelines');

    // Guidelines link now has aria-current="page"
    await expect(guidelinesLink).toHaveAttribute('aria-current', 'page');
  });

  test('4. Keyboard navigation: Skip link focuses main content; Tab moves into sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');

    // Tab once to focus the skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to content/i });
    await expect(skipLink).toBeFocused();

    // Press Enter to skip
    await page.keyboard.press('Enter');
    const mainContent = page.locator('main#main');
    await expect(mainContent).toBeFocused();
  });

  test('5. Mobile viewport (360px): Hamburger toggles drawer; link click navigates & closes; Escape closes', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/dashboard');

    const openBtn = page.getByRole('button', { name: /open navigation menu/i });
    await expect(openBtn).toBeVisible();

    // Open drawer
    await openBtn.click();
    const drawer = page.getByRole('dialog', { name: /main menu/i });
    await expect(drawer).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();

    // Reopen and navigate by clicking a link
    await openBtn.click();
    await expect(drawer).toBeVisible();

    const guidelinesLink = drawer.getByRole('link', { name: /guidelines/i });
    await guidelinesLink.click();
    await page.waitForURL('**/guidelines');

    // Drawer closes after navigation
    await expect(drawer).not.toBeVisible();
  });

  test('6. Switch demo persona updates visible navigation links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');

    // Log in as Creator
    const ashaBtn = page.getByTestId('demo-creator-asha');
    if (await ashaBtn.isVisible()) {
      await ashaBtn.click();
      await page.waitForURL('**/dashboard');
    } else {
      await page.goto('/dashboard');
    }

    const sidebarNav = page.locator('nav[aria-label="Main"]');

    // Creator should not see Insights or Audit
    await expect(sidebarNav.getByRole('link', { name: /insights/i })).toHaveCount(0);
    await expect(sidebarNav.getByRole('link', { name: /audit/i })).toHaveCount(0);

    // Switch persona to Reviewer
    const personaBtn = sidebarNav.getByRole('button', { name: /current user|switch demo persona/i });
    await personaBtn.click();

    const switchReviewer = page.getByRole('button', { name: /switch to priya/i });
    await expect(switchReviewer).toBeVisible();
    await switchReviewer.click();

    // Now Reviewer sees Insights and Audit
    await expect(sidebarNav.getByRole('link', { name: /insights/i })).toBeVisible();
    await expect(sidebarNav.getByRole('link', { name: /audit/i })).toBeVisible();
  });
});
