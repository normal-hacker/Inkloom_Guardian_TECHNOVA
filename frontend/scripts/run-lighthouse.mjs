import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

async function audit(url, cookie, outPath) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility'],
    port: chrome.port,
    extraHeaders: cookie ? { Cookie: cookie } : undefined,
  };

  const runnerResult = await lighthouse(url, options);
  fs.writeFileSync(outPath, runnerResult.report);
  await chrome.kill();

  const perf = runnerResult.lhr.categories.performance?.score * 100;
  const a11y = runnerResult.lhr.categories.accessibility?.score * 100;
  console.log(`URL: ${url} -> Performance: ${perf}, Accessibility: ${a11y}`);
}

async function main() {
  await audit(
    'http://127.0.0.1:3000/dashboard',
    'inkloom_session=mock-session-priya-reviewer',
    'frontend/lighthouse-dashboard.json'
  );
}

main().catch(console.error);

