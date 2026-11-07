import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('screenshots/before');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { width: 360, height: 800, label: '360' },
  { width: 768, height: 1024, label: '768' },
  { width: 1280, height: 800, label: '1280' },
];

const routes = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
  { path: '/dashboard', name: 'dashboard', auth: true },
  { path: '/content/new', name: 'content_new', auth: true },
  { path: '/guidelines', name: 'guidelines', auth: true },
  { path: '/insights', name: 'insights', auth: true },
  { path: '/audit', name: 'audit', auth: true },
  { path: '/about-ai', name: 'about_ai' },
  { path: '/demo-report', name: 'demo_report' },
  { path: '/build-notes', name: 'build_notes' },
];

async function main() {
  const browser = await chromium.launch();

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });

    // Add session cookie for authenticated views
    await context.addCookies([
      {
        name: 'inkloom_session',
        value: 'mock-session-priya-reviewer',
        domain: '127.0.0.1',
        path: '/',
      },
    ]);

    const page = await context.newPage();

    for (const r of routes) {
      const url = `http://127.0.0.1:3000${r.path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500); // let animations settle
        const filename = `${r.name}_${vp.label}.png`;
        const filepath = path.join(outDir, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`Captured: ${filename}`);
      } catch (err) {
        console.error(`Failed ${r.path} @ ${vp.label}: ${err.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('All baseline screenshots captured.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

