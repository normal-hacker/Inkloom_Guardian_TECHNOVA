import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test.describe('Content Intake & Document Upload E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as Asha (Creator)
    await page.goto('/login');
    const ashaBtn = page.getByTestId('demo-creator-asha');
    await expect(ashaBtn).toBeVisible();
    await ashaBtn.click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('1. Upload TXT file extracts text, populates review area, and audits findings', async ({ page }) => {
    // Prepare a temporary file with brand violations
    const tempFilePath = path.resolve('/tmp/e2e-sample.txt');
    fs.writeFileSync(
      tempFilePath,
      'Our panels are the best on the market and guarantee 40% savings! Call today for clean energy.'
    );

    await page.goto('/content/new');
    await expect(page.getByRole('heading', { name: /submit content/i })).toBeVisible();

    // Switch to Upload Document tab
    await page.getByRole('button', { name: /upload document/i }).click();

    // Upload the file via the file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFilePath);

    // Verify extraction success message appears
    await expect(page.getByText(/document "e2e-sample.txt" extracted successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify Review & Edit Extracted Text section is visible
    await expect(page.getByText(/review & edit extracted text/i)).toBeVisible();

    // Verify the textarea is populated with the extracted text
    const textarea = page.locator('textarea[required]');
    await expect(textarea).toHaveValue(/best on the market and guarantee 40% savings/i);

    // Edit the text before submitting
    await textarea.fill(
      'Our panels are the best on the market and guarantee 40% savings! Special limited-time offer.'
    );

    // Click Save & Next / submit button
    const submitBtn = page.getByRole('button', { name: /save & next/i });
    await submitBtn.click();

    // Verify redirection to Review Workspace (/content/[id])
    await page.waitForURL(/\/content\/[0-9a-f-]+/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/content\/[0-9a-f-]+/);

    // Verify brand rules were evaluated and findings are displayed
    await expect(page.getByText(/CLAIM-001/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/CLAIM-002/i)).toBeVisible();
    await expect(page.getByText(/NUM-001/i)).toBeVisible();

    // Clean up temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  });

  test('2. Uploading empty file displays explicit validation error', async ({ page }) => {
    const emptyFilePath = path.resolve('/tmp/e2e-empty.txt');
    fs.writeFileSync(emptyFilePath, '');

    await page.goto('/content/new');
    await page.getByRole('button', { name: /upload document/i }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(emptyFilePath);

    // Verify the explicit error message is displayed
    await expect(page.getByText(/no readable text found.*empty/i)).toBeVisible();

    if (fs.existsSync(emptyFilePath)) fs.unlinkSync(emptyFilePath);
  });

  test('3. Uploading unsupported file type displays explicit rejection error', async ({ page }) => {
    const unsupportedFilePath = path.resolve('/tmp/e2e-unsupported.xyz');
    fs.writeFileSync(unsupportedFilePath, 'unsupported format data');

    await page.goto('/content/new');
    await page.getByRole('button', { name: /upload document/i }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(unsupportedFilePath);

    // Verify error message is shown
    await expect(page.getByText(/unsupported file format/i)).toBeVisible();

    if (fs.existsSync(unsupportedFilePath)) fs.unlinkSync(unsupportedFilePath);
  });
});
