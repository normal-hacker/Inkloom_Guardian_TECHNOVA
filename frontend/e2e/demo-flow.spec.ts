import { test, expect } from '@playwright/test';

test.describe('Phase 1.1: Parallel Isolated Guided Demo Flows', () => {
  test('two visitors concurrently run guided demo without seeing each other rows', async ({ browser }) => {
    // Context 1 (Judge A)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    // Context 2 (Judge B)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    try {
      // 1. Judge A starts demo
      const res1 = await page1.request.post('/api/v1/demo-session/start');
      expect(res1.ok()).toBeTruthy();
      const data1 = await res1.json();
      expect(data1.demoSessionId).toBeTruthy();

      // 2. Judge B starts demo in parallel
      const res2 = await page2.request.post('/api/v1/demo-session/start');
      expect(res2.ok()).toBeTruthy();
      const data2 = await res2.json();
      expect(data2.demoSessionId).toBeTruthy();
      expect(data1.demoSessionId).not.toBe(data2.demoSessionId);

      // 3. Judge A visits guided walkthrough
      await page1.goto(data1.redirectUrl);
      await expect(page1.getByText(`Demo Session: ${data1.demoSessionId.slice(0, 8)}`)).toBeVisible();

      // 4. Judge B visits guided walkthrough
      await page2.goto(data2.redirectUrl);
      await expect(page2.getByText(`Demo Session: ${data2.demoSessionId.slice(0, 8)}`)).toBeVisible();

      // Assert isolation: Judge A does NOT see Judge B session id in DOM
      await expect(page1.getByText(data2.demoSessionId.slice(0, 8))).toHaveCount(0);
      await expect(page2.getByText(data1.demoSessionId.slice(0, 8))).toHaveCount(0);

      // Judge A runs step 1 -> step 2 (Run checks)
      await page1.locator('[data-testid="run-checks-btn"]').click();
      await expect(page1.locator('[data-testid="switch-priya-btn"]')).toBeVisible();

      // Judge A switches to Priya (Step 3)
      await page1.locator('[data-testid="switch-priya-btn"]').click();
      await expect(page1.locator('[data-testid="attempt-blocker-approval-btn"]')).toBeVisible();

      // Judge A attempts approval with open blocker (Step 4)
      await page1.locator('[data-testid="attempt-blocker-approval-btn"]').click();
      await expect(page1.locator('[data-testid="server-refusal-box"]')).toBeVisible();

      // Judge A proceeds to resolve (Step 5)
      await page1.locator('[data-testid="proceed-resolve-btn"]').click();
      await page1.locator('[data-testid="apply-clean-copy-btn"]').click();
      await page1.locator('[data-testid="approve-clean-btn"]').click();

      // Step 6: View Ledger
      await expect(page1.locator('[data-testid="finish-demo-btn"]')).toBeVisible();
      await page1.locator('[data-testid="finish-demo-btn"]').click();

      // Step 7: Final Screen
      const finalScreenText = page1.locator('[data-testid="final-screen-text"]');
      await expect(finalScreenText).toBeVisible();
      await expect(finalScreenText).toContainText('The AI advised. A human decided. The record proves it.');
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

