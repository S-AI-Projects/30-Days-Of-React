import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T056');

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51732, host: 'localhost' },
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Server listening on ${baseUrl}`);

  const pageErrors = [];
  const consoleErrors = [];
  const keyWarnings = [];

  console.log('Launching Playwright Chromium browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') consoleErrors.push(text);
    if (text.toLowerCase().includes('each child in a list should have a unique "key" prop') ||
        (text.toLowerCase().includes('key') && text.toLowerCase().includes('warning'))) {
      keyWarnings.push(text);
    }
  });

  const testSteps = [];

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Step 1: Verify Initial Render
    console.log('Step 1: Checking Initial Render...');
    const initialItems = page.locator('[data-testid="record-list"] > li');
    await expect(initialItems).toHaveCount(3);
    await expect(page.locator('[data-testid="input-rec-1"]')).toHaveValue('Initial Alpha');
    await expect(page.locator('[data-testid="input-rec-2"]')).toHaveValue('Initial Beta');
    await expect(page.locator('[data-testid="input-rec-3"]')).toHaveValue('Initial Gamma');
    testSteps.push({ step: 1, action: 'initial_render', passed: true });

    // Step 2: Edit Record Beta
    console.log('Step 2: Editing Record Beta...');
    await page.locator('[data-testid="input-rec-2"]').fill('Edited Beta Value');
    await expect(page.locator('[data-testid="input-rec-2"]')).toHaveValue('Edited Beta Value');
    testSteps.push({ step: 2, action: 'edit_rec_2', passed: true });

    // Step 3: Reorder (Reverse) List
    console.log('Step 3: Reversing List Order...');
    await page.locator('[data-testid="btn-reverse"]').click();

    // Verify new visual order: rec-3, rec-2, rec-1
    const reversedFirst = await initialItems.nth(0).getAttribute('data-testid');
    const reversedSecond = await initialItems.nth(1).getAttribute('data-testid');
    const reversedThird = await initialItems.nth(2).getAttribute('data-testid');
    expect(reversedFirst).toBe('record-rec-3');
    expect(reversedSecond).toBe('record-rec-2');
    expect(reversedThird).toBe('record-rec-1');

    // Crucial check: Edited value stayed with rec-2!
    await expect(page.locator('[data-testid="input-rec-2"]')).toHaveValue('Edited Beta Value');
    await expect(page.locator('[data-testid="input-rec-1"]')).toHaveValue('Initial Alpha');
    await expect(page.locator('[data-testid="input-rec-3"]')).toHaveValue('Initial Gamma');
    testSteps.push({ step: 3, action: 'reverse_and_verify_state_persistence', passed: true });

    // Step 4: Move Item Up
    console.log('Step 4: Moving Record Beta Up...');
    await page.locator('[data-testid="move-up-rec-2"]').click();

    // Now rec-2 should be first item: rec-2, rec-3, rec-1
    const movedFirst = await initialItems.nth(0).getAttribute('data-testid');
    expect(movedFirst).toBe('record-rec-2');
    await expect(page.locator('[data-testid="input-rec-2"]')).toHaveValue('Edited Beta Value');
    testSteps.push({ step: 4, action: 'move_up_and_verify', passed: true });

    // Step 5: Check zero key warnings and zero errors
    console.log('Step 5: Verifying zero key warnings and zero console errors...');
    expect(keyWarnings).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
    testSteps.push({ step: 5, action: 'verify_zero_warnings_or_errors', passed: true });

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T056',
      title: 'Day 6: stable list keys — refactor an applied example',
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
        editedValueRetainedAfterReorder: true,
        zeroKeyWarnings: keyWarnings.length === 0,
        zeroPageErrors: pageErrors.length === 0,
        zeroConsoleErrors: consoleErrors.length === 0
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T056/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
