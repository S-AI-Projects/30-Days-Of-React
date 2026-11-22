import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T059');

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51738, host: 'localhost' },
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

  const experimentResults = [];

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Step 1: Initial state & Subtree Isolation Verification
    console.log('Step 1: Checking Initial State and Subtree Isolation...');
    await expect(page.locator('[data-testid="theme-val-root-1"]')).toHaveText('light');
    await expect(page.locator('[data-testid="theme-val-sub-1"]')).toHaveText('dark');

    // Toggle Root Theme -> Root changes to dark, Subtree stays dark
    console.log('Toggling Root Theme...');
    await page.locator('[data-testid="btn-toggle-root"]').click();
    await expect(page.locator('[data-testid="theme-val-root-1"]')).toHaveText('dark');
    await expect(page.locator('[data-testid="theme-val-sub-1"]')).toHaveText('dark');

    // Toggle Subtree Theme -> Subtree changes to light, Root stays dark
    console.log('Toggling Subtree Theme...');
    await page.locator('[data-testid="btn-toggle-sub"]').click();
    await expect(page.locator('[data-testid="theme-val-sub-1"]')).toHaveText('light');
    await expect(page.locator('[data-testid="theme-val-root-1"]')).toHaveText('dark');

    // Reset root back to light for standardized experiment baseline
    await page.locator('[data-testid="btn-toggle-root"]').click();
    await expect(page.locator('[data-testid="theme-val-root-1"]')).toHaveText('light');

    // Three Bounded Input Scale Experiments: N = 1, N = 3, N = 5
    const boundedScales = [1, 3, 5];

    for (const scaleSize of boundedScales) {
      console.log(`Running Experiment for Bounded Scale N = ${scaleSize}...`);
      await page.locator(`[data-testid="btn-scale-${scaleSize}"]`).click();

      // Verify number of root consumer elements
      const consumerCards = page.locator('#root [data-testid^="consumer-root-"]');
      await expect(consumerCards).toHaveCount(scaleSize);

      // Perform repeated interaction (toggle 2 times: light -> dark -> light)
      let operations = 0;
      await page.locator('[data-testid="btn-toggle-root"]').click();
      operations += 1;
      for (let i = 1; i <= scaleSize; i++) {
        await expect(page.locator(`[data-testid="theme-val-root-${i}"]`)).toHaveText('dark');
      }

      await page.locator('[data-testid="btn-toggle-root"]').click();
      operations += 1;
      for (let i = 1; i <= scaleSize; i++) {
        await expect(page.locator(`[data-testid="theme-val-root-${i}"]`)).toHaveText('light');
      }

      // Read render counts
      const renderTexts = await page.locator('[data-testid^="renders-root-"]').allTextContents();
      const reportedRenders = renderTexts.map((t) => parseInt(t.replace(/\D/g, ''), 10));

      experimentResults.push({
        scaleSize,
        consumersVerified: scaleSize,
        operationsExecuted: operations,
        observedRenders: reportedRenders,
        correctnessAsserted: true
      });
    }

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`Unexpected errors observed: ${JSON.stringify({ pageErrors, consoleErrors })}`);
    }

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T059',
      title: 'Day 26: context scope — input-scale experiment',
      passed: true,
      timestamp: new Date().toISOString(),
      toolVersions: {
        node: process.version,
        playwright: '1.48.2',
        react: '18.3.1',
        vite: '5.4.10'
      },
      subtreeIsolationVerified: true,
      experiments: experimentResults,
      errors: {
        pageErrors,
        consoleErrors
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T059/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
