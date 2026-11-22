import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T054');

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51737, host: 'localhost' },
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

    // Step 1: Initial Mount Invariant
    console.log('Step 1: Checking Initial Mount Invariant...');
    await expect(page.locator('[data-testid="active-listeners-count"]')).toHaveText('1');
    await expect(page.locator('[data-testid="subscribed-channel"]')).toHaveText('channel-A');
    await page.locator('[data-testid="btn-emit-a"]').click();
    await expect(page.locator('[data-testid="received-count"]')).toHaveText('1');
    await expect(page.locator('[data-testid="last-message"]')).toHaveText('Event A message');
    testSteps.push({ step: 1, action: 'initial_mount_active_listeners_1', passed: true });

    // Step 2: Dependency Change (Channel Switch) Invariant
    console.log('Step 2: Switching Channel to B (Dependency Change)...');
    await page.locator('[data-testid="btn-channel-b"]').click();
    await expect(page.locator('[data-testid="subscribed-channel"]')).toHaveText('channel-B');
    // Invariant: still exactly 1 listener (old unsubscribed, new subscribed)
    await expect(page.locator('[data-testid="active-listeners-count"]')).toHaveText('1');

    // Emitting on old channel A should be ignored
    await page.locator('[data-testid="btn-emit-a"]').click();
    await expect(page.locator('[data-testid="received-count"]')).toHaveText('1');

    // Emitting on new channel B should be received
    await page.locator('[data-testid="btn-emit-b"]').click();
    await expect(page.locator('[data-testid="received-count"]')).toHaveText('2');
    await expect(page.locator('[data-testid="last-message"]')).toHaveText('Event B message');
    testSteps.push({ step: 2, action: 'dependency_change_old_subscription_removed_count_1', passed: true });

    // Step 3: Unmount Invariant
    console.log('Step 3: Unmounting Subscriber...');
    await page.locator('[data-testid="btn-toggle-mount"]').click();
    await expect(page.locator('[data-testid="unmounted-msg"]')).toBeVisible();
    // Invariant: exactly 0 active listeners upon unmount
    await expect(page.locator('[data-testid="active-listeners-count"]')).toHaveText('0');

    // Emitting while unmounted causes zero updates and zero errors
    await page.locator('[data-testid="btn-emit-b"]').click();
    await expect(page.locator('[data-testid="active-listeners-count"]')).toHaveText('0');
    testSteps.push({ step: 3, action: 'unmount_leaves_zero_active_listeners', passed: true });

    // Step 4: Re-mount Invariant
    console.log('Step 4: Re-mounting Subscriber...');
    await page.locator('[data-testid="btn-toggle-mount"]').click();
    await expect(page.locator('[data-testid="subscriber-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-listeners-count"]')).toHaveText('1');
    testSteps.push({ step: 4, action: 'remount_restores_active_listeners_1', passed: true });

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`Unexpected errors observed: ${JSON.stringify({ pageErrors, consoleErrors })}`);
    }

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T054',
      title: 'Day 22: effect cleanup — state/invariant lab',
      passed: true,
      timestamp: new Date().toISOString(),
      toolVersions: {
        node: process.version,
        playwright: '1.48.2',
        react: '18.3.1',
        vite: '5.4.10'
      },
      steps: testSteps,
      invariantChecks: {
        mountedActiveListenersCountIs1: true,
        unmountedActiveListenersCountIs0: true,
        dependencyChangeRemovesOldSubscription: true,
        zeroConsoleErrors: consoleErrors.length === 0,
        zeroPageErrors: pageErrors.length === 0
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T054/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
