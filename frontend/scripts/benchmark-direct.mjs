import { chromium } from '@playwright/test';

async function runDirectBenchmark() {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  await context.addCookies([
    { name: 'inkloom_session', value: 'mock-session-priya-reviewer', domain: '127.0.0.1', path: '/' },
    { name: 'inkloom_session', value: 'mock-session-priya-reviewer', domain: 'localhost', path: '/' },
  ]);

  const page = await context.newPage();
  const contentId = '70000000-0000-0000-0000-000000000001';

  await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
    if (route.request().method() === 'POST') {
      await new Promise((res) => setTimeout(res, 2000));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'server-c-' + Math.random(),
          contentItemId: contentId,
          authorEmail: 'priya@brightway.example',
          authorRole: 'reviewer',
          body: 'Bench',
          createdAt: new Date().toISOString(),
        }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ comments: [] }) });
    }
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: '003', email: 'priya@brightway.example', role: 'reviewer' } }),
    });
  });

  await page.route(`**/api/v1/content/${contentId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ item: { id: contentId, title: 'Blog', contentType: 'blog', status: 'in_review', currentVersionNo: 1 } }),
    });
  });

  await page.route(`**/api/v1/content/${contentId}/versions`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ versions: [{ id: 'v1', versionNo: 1, textBody: 'Body' }] }) });
  });

  await page.route(`**/api/v1/content/${contentId}/findings`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ findings: [] }) });
  });

  await page.route('**/api/v1/audit**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
  });

  await page.goto(`http://127.0.0.1:3000/content/${contentId}`);
  const input = page.getByPlaceholder(/add an internal reviewer comment/i);
  await input.waitFor({ state: 'visible' });

  const measurements = [];

  for (let i = 1; i <= 20; i++) {
    const text = `Direct comment ${i}`;
    await input.fill(text);

    const delta = await page.evaluate(async (commentText) => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim().startsWith('Post'));
      const start = performance.now();
      btn.click();
      // Wait for React to commit DOM update via requestAnimationFrame
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const end = performance.now();
      return Number((end - start).toFixed(2));
    }, text);

    measurements.push(delta);
    await page.waitForTimeout(40);
  }

  await browser.close();

  measurements.sort((a, b) => a - b);
  const median = (measurements[9] + measurements[10]) / 2;
  console.log('=== REACT INTERNAL OPTIMISTIC DISPATCH-TO-RENDER DELTA (20 runs) ===');
  console.log(`Runs: [${measurements.join(', ')}] ms`);
  console.log(`Min:    ${measurements[0]} ms`);
  console.log(`Median: ${median.toFixed(2)} ms`);
  console.log(`P95:    ${measurements[18]} ms`);
  console.log(`Max:    ${measurements[19]} ms`);
}

runDirectBenchmark().catch(console.error);

