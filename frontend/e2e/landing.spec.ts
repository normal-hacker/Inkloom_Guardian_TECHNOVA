import { expect, test } from "@playwright/test";

test("existing landing page remains available", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /check copy before it reaches the public/i,
    }),
  ).toBeVisible();
});
