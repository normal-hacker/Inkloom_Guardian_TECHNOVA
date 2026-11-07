import { chromium } from '@playwright/test';

async function runBenchmark() {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  await context.addCookies([
    {
      name: 'inkloom_session',
      value: 'mock-session-priya-reviewer',
      domain: '127.0.0.1',
      path: '/',
    },
    {
      name: 'inkloom_session',
      value: 'mock-session-priya-reviewer',
      domain: 'localhost',
      path: '/',
    },
  ]);

  const page = await context.newPage();
  const contentId = '70000000-0000-0000-0000-000000000001';

  // Mock server delay 2000ms so we strictly isolate optimistic render time from server response
  await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
    if (route.request().method() === 'POST') {
      await new Promise((res) => setTimeout(res, 2000));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-server-comm-' + Math.random(),
          contentItemId: contentId,
          authorEmail: 'priya@brightway.example',
          authorRole: 'reviewer',
          body: 'Benchmark comment',
          createdAt: new Date().toISOString(),
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ comments: [] }),
      });
    }
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '00000000-0000-0000-0000-000000000003',
          email: 'priya@brightway.example',
          displayName: 'Priya (Reviewer)',
          role: 'reviewer',
        },
      }),
    });
  });

  await page.route(`**/api/v1/content/${contentId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        item: {
          id: contentId,
          title: 'Spring savings blog',
          contentType: 'blog',
          status: 'in_review',
          currentVersionNo: 1,
          ownerId: '00000000-0000-0000-0000-000000000001',
        },
      }),
    });
  });

  await page.route(`**/api/v1/content/${contentId}/versions`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        versions: [{ id: 'ver-1', versionNo: 1, textBody: 'Benchmark content body.', contentHash: 'h1', createdAt: new Date().toISOString() }],
      }),
    });
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
    const text = `Perf comment ${i}`;
    await input.fill(text);

    // Measure exact browser render delta using performance.now()
    const t0 = await page.evaluate(() => performance.now());
    await page.getByRole('button', { name: /^post$/i }).click();
    await page.locator(`text=${text}`).waitFor({ state: 'visible' });
    const t1 = await page.evaluate(() => performance.now());

    const delta = Number((t1 - t0).toFixed(2));
    measurements.push(delta);
    console.log(`Run ${i.toString().padStart(2, ' ')}: ${delta} ms`);
    await page.waitForTimeout(50);
  }

  await browser.close();

  measurements.sort((a, b) => a - b);
  const median = (measurements[9] + measurements[10]) / 2;
  const p95 = measurements[Math.floor(measurements.length * 0.95)];
  const min = measurements[0];
  const max = measurements[measurements.length - 1];

  console.log('=== OPTIMISTIC RENDER TIME BENCHMARK (20 runs) ===');
  console.log(`Runs: [${measurements.join(', ')}] ms`);
  console.log(`Min:    ${min} ms`);
  console.log(`Median: ${median.toFixed(2)} ms`);
  console.log(`P95:    ${p95} ms`);
  console.log(`Max:    ${max} ms`);
  console.log('Method: In-browser high-resolution performance.now() from button dispatch to MutationObserver DOM insertion of the optimistic node.');
}

runBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
