import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T057');

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51735, host: 'localhost' },
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Server listening on ${baseUrl}`);

  const pageErrors = [];
  const consoleErrors = [];

  console.log('Launching Playwright Chromium browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const testSteps = [];

  try {
    // Step 1: Initial Home Route
    console.log('Step 1: Checking Home Route...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await expect(page.locator('[data-testid="home-view"]')).toBeVisible();
    testSteps.push({ step: 1, action: 'initial_home_route', passed: true });

    // Step 2: Navigate to Known ID
    console.log('Step 2: Navigating to known ID (item-1)...');
    await page.locator('[data-testid="link-item-1"]').click();
    await expect(page.locator('[data-testid="detail-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-title"]')).toHaveText('Product Alpha');
    await expect(page.locator('[data-testid="detail-desc"]')).toHaveText('High performance productivity tool.');
    testSteps.push({ step: 2, action: 'navigate_known_id_shows_detail', passed: true });

    // Step 3: Navigate to Unknown ID
    console.log('Step 3: Navigating to unknown ID (unknown-999)...');
    await page.locator('[data-testid="link-unknown"]').click();
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found"]')).toContainText('Not found');
    testSteps.push({ step: 3, action: 'navigate_unknown_id_shows_not_found', passed: true });

    // Step 4: Browser Back Restores Prior View (Known ID)
    console.log('Step 4: Testing Browser Back restores Known ID view...');
    await page.goBack();
    await expect(page.locator('[data-testid="detail-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-title"]')).toHaveText('Product Alpha');
    testSteps.push({ step: 4, action: 'browser_back_restores_detail_view', passed: true });

    // Step 5: Browser Back Restores Home Route
    console.log('Step 5: Testing Browser Back restores Home view...');
    await page.goBack();
    await expect(page.locator('[data-testid="home-view"]')).toBeVisible();
    testSteps.push({ step: 5, action: 'browser_back_restores_home_view', passed: true });

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`Unexpected errors observed: ${JSON.stringify({ pageErrors, consoleErrors })}`);
    }

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T057',
      title: 'Day 17: route behavior — executable lesson example',
      passed: true,
      timestamp: new Date().toISOString(),
      toolVersions: {
        node: process.version,
        playwright: '1.48.2',
        react: '18.3.1',
        reactRouter: '6.26.2',
        vite: '5.4.10'
      },
      steps: testSteps,
      contractChecks: {
        knownIdShowsDetail: true,
        unknownIdShowsNotFound: true,
        browserBackRestoresPriorView: true,
        zeroConsoleErrors: consoleErrors.length === 0,
        zeroPageErrors: pageErrors.length === 0
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T057/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
