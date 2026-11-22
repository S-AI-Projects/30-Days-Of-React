import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T058');

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51736, host: 'localhost' },
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
    // Step 1: Initial Page 1 Load
    console.log('Step 1: Checking Page 1 Initial Load...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await expect(page.locator('[data-testid="status"]')).toHaveText('success');
    await expect(page.locator('[data-testid="cat-item-c1"]')).toContainText('Siamese');
    await expect(page.locator('[data-testid="cat-item-c2"]')).toContainText('Persian');
    testSteps.push({ step: 1, action: 'initial_page_1_load_success', passed: true });

    // Step 2: Page 2 Failure State
    console.log('Step 2: Navigating to Page 2 (demonstrating error state)...');
    await page.locator('[data-testid="btn-page-2"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveText('error');
    await expect(page.locator('[data-testid="error-message"]')).toHaveText('Failed to load page 2 cats.');
    await expect(page.locator('[data-testid="btn-retry"]')).toBeVisible();
    testSteps.push({ step: 2, action: 'page_2_error_state_displayed', passed: true });

    // Step 3: In-Session Recovery via Retry
    console.log('Step 3: Triggering Retry for Page 2 (demonstrating recovery)...');
    await page.locator('[data-testid="btn-retry"]').click();
    await expect(page.locator('[data-testid="status"]')).toHaveText('success');
    await expect(page.locator('[data-testid="cat-item-c3"]')).toContainText('Maine Coon');
    await expect(page.locator('[data-testid="cat-item-c4"]')).toContainText('Bengal');
    testSteps.push({ step: 3, action: 'page_2_retry_recovery_success', passed: true });

    // Step 4: Stale Response Prevention (Slow Page 3 -> Fast Page 1)
    console.log('Step 4: Testing Stale Response Prevention (Slow Page 3 -> Fast Page 1)...');
    await page.locator('[data-testid="btn-page-3"]').click(); // 250ms
    await page.waitForTimeout(20);
    await page.locator('[data-testid="btn-page-1"]').click(); // 50ms

    // Page 1 resolves fast
    await expect(page.locator('[data-testid="status"]')).toHaveText('success', { timeout: 3000 });
    await expect(page.locator('[data-testid="cat-item-c1"]')).toContainText('Siamese');

    // Wait for slow Page 3 request to finish
    await page.waitForTimeout(350);

    // Verify view strictly remains Page 1 cats (Siamese / Persian), NOT Page 3
    await expect(page.locator('[data-testid="current-page"]')).toHaveText('1');
    await expect(page.locator('[data-testid="cat-item-c1"]')).toContainText('Siamese');
    await expect(page.locator('[data-testid="cat-item-c5"]')).toHaveCount(0);
    testSteps.push({ step: 4, action: 'stale_response_dropped_latest_page_preserved', passed: true });

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`Unexpected errors observed: ${JSON.stringify({ pageErrors, consoleErrors })}`);
    }

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T058',
      title: 'Day 20: cat-gallery failure recovery — failure-and-recovery lab',
      passed: true,
      timestamp: new Date().toISOString(),
      toolVersions: {
        node: process.version,
        playwright: '1.48.2',
        react: '18.3.1',
        vite: '5.4.10'
      },
      steps: testSteps,
      contractChecks: {
        pageReplacedOnNavigation: true,
        failedPageRecoversOnRetry: true,
        staleResponseDropped: true,
        zeroErrors: pageErrors.length === 0 && consoleErrors.length === 0
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T058/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
