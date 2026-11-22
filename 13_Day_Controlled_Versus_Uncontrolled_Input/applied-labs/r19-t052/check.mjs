import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T052');

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51733, host: 'localhost' },
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

    // Step 1: Empty Input Boundary Check
    console.log('Step 1: Checking Empty Input Boundary...');
    await expect(page.locator('[data-testid="status"]')).toHaveText('idle');
    await expect(page.locator('[data-testid="result"]')).toHaveText('Enter a valid query');
    testSteps.push({ step: 1, action: 'empty_boundary_check', passed: true });

    // Step 2: Race Condition Check (Slow A followed immediately by Fast B)
    console.log('Step 2: Checking Race Condition (Slow A -> Fast B)...');
    await page.locator('[data-testid="btn-query-alpha"]').click(); // 250ms
    await page.waitForTimeout(20);
    await page.locator('[data-testid="btn-query-beta"]').click(); // 50ms

    // Fast query B resolves first
    await expect(page.locator('[data-testid="status"]')).toHaveText('success', { timeout: 3000 });
    await expect(page.locator('[data-testid="result"]')).toHaveText('Result for Beta');

    // Wait 350ms so slow query A finishes
    await page.waitForTimeout(350);

    // Verify result remains Beta (Slow A did NOT overwrite newer B)
    await expect(page.locator('[data-testid="status"]')).toHaveText('success');
    await expect(page.locator('[data-testid="result"]')).toHaveText('Result for Beta');
    testSteps.push({ step: 2, action: 'race_condition_prevented_slow_a_did_not_overwrite_b', passed: true });

    // Step 3: Unmount While Request in Flight
    console.log('Step 3: Checking Unmount While Request in Flight...');
    await page.locator('[data-testid="btn-query-alpha"]').click();
    await page.waitForTimeout(10);
    await page.locator('[data-testid="btn-toggle-mount"]').click();
    await expect(page.locator('[data-testid="unmounted-msg"]')).toBeVisible();

    // Wait for in-flight request to resolve
    await page.waitForTimeout(350);

    // Verify no unmount state update errors logged
    expect(pageErrors).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
    testSteps.push({ step: 3, action: 'unmount_cleanup_no_post_unmount_errors', passed: true });

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T052',
      title: 'Day 13: lifecycle request cleanup — boundary-focused lab',
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
        emptyBoundaryHandled: true,
        staleResultPrevented: true,
        noPostUnmountStateUpdateErrors: pageErrors.length === 0 && consoleErrors.length === 0
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T052/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
