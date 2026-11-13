import { test, expect } from '@playwright/test';

test.describe('Login Screen E2E Suite (§10 Acceptance)', () => {
  test('1. Unauthenticated user visits /login and enters as Asha (Creator) in 1 click', async ({ page }) => {
    await page.goto('/login');

    // Verify brand header & title
    await expect(page.getByRole('heading', { name: /check before you publish/i })).toBeVisible();

    // Verify demo button for Asha is present
    const ashaBtn = page.getByTestId('demo-creator-asha');
    await expect(ashaBtn).toBeVisible();

    // Click demo login
    await ashaBtn.click();

    // Verify modal loading or direct dashboard redirect
    await page.waitForURL('**/dashboard', { timeout: 15000, waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/dashboard');
  });

  test('2. Unauthenticated user logs in as Priya (Reviewer)', async ({ page }) => {
    // Clear cookies to be logged out
    await page.context().clearCookies();
    await page.goto('/login');

    const priyaBtn = page.getByTestId('demo-reviewer-priya');
    await expect(priyaBtn).toBeVisible();

    await priyaBtn.click();
    await page.waitForURL('**/dashboard', { timeout: 15000, waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/dashboard');
  });

  test('3. Google button is gracefully disabled with explanation when unconfigured', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');

    const googleBtn = page.getByRole('button', { name: /continue with google/i });
    if (await googleBtn.isVisible()) {
      await expect(googleBtn).toBeDisabled();
      await expect(
        page.getByText(/not available on this deployment — demo accounts work without it/i)
      ).toBeVisible();
    } else {
      // In accordance with PROMPT 1 item 1.3: Google button removed when unconfigured
      await expect(googleBtn).toHaveCount(0);
    }
  });

  test('4. Safe redirect preservation via ?next parameter', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login?next=/guidelines');

    const ashaBtn = page.getByTestId('demo-creator-asha');
    await ashaBtn.click();

    await page.waitForURL('**/guidelines', { timeout: 10000 });
    expect(page.url()).toContain('/guidelines');
  });
});

