import { expect, test } from "@playwright/test";

test("existing landing page remains available", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /stop risky brand content before it publishes/i,
    }),
  ).toBeVisible();
});
