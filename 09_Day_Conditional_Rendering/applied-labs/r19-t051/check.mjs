import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T051');

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51730, host: 'localhost' },
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
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Step 1: Initial Loading State
    console.log('Step 1: Checking Initial Loading State...');
    await expect(page.locator('[data-testid="view-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-empty"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="view-success"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="view-error"]')).toHaveCount(0);
    testSteps.push({ state: 'loading', expected: 'view-loading visible only', passed: true });

    // Step 2: Empty State
    console.log('Step 2: Checking Empty State...');
    await page.locator('[data-testid="btn-empty"]').click();
    await expect(page.locator('[data-testid="view-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-loading"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="view-success"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="view-error"]')).toHaveCount(0);
    testSteps.push({ state: 'empty', expected: 'view-empty visible only', passed: true });

    // Step 3: Success State
    console.log('Step 3: Checking Success State...');
    await page.locator('[data-testid="btn-success"]').click();
    await expect(page.locator('[data-testid="view-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-1"]')).toHaveText('First Item');
    await expect(page.locator('[data-testid="item-2"]')).toHaveText('Second Item');
    await expect(page.locator('[data-testid="view-loading"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="view-empty"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="view-error"]')).toHaveCount(0);
    testSteps.push({ state: 'success', expected: 'view-success with items visible only', passed: true });

    // Step 4: Error State
    console.log('Step 4: Checking Error State...');
    await page.locator('[data-testid="btn-error"]').click();
    await expect(page.locator('[data-testid="view-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-error"]')).toHaveText('Failed to fetch items.');
    await expect(page.locator('[data-testid="view-loading"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="view-empty"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="view-success"]')).toHaveCount(0);
    testSteps.push({ state: 'error', expected: 'view-error with message visible only', passed: true });

    // Verify console and page errors
    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`Unexpected errors: pageErrors=${JSON.stringify(pageErrors)}, consoleErrors=${JSON.stringify(consoleErrors)}`);
    }

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T051',
      title: 'Day 9: conditional display — implement the applied example',
      passed: true,
      timestamp: new Date().toISOString(),
      toolVersions: {
        node: process.version,
        playwright: '1.48.2',
        react: '18.3.1',
        vite: '5.4.10'
      },
      steps: testSteps,
      errors: {
        pageErrors,
        consoleErrors
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T051/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
