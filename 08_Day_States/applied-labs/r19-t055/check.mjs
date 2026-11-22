import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIXTURE_ACTIONS } from './fixture.mjs';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T055');

async function executeRun(browser, baseUrl, runLabel) {
  const context = await browser.newContext();
  const page = await context.newPage();

  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const history = [];

  for (const step of FIXTURE_ACTIONS) {
    if (step.click) {
      await page.locator(`[data-testid="${step.click}"]`).click();
    }
    const valText = await page.locator('[data-testid="quantity-value"]').textContent();
    const currentVal = parseInt(valText.trim(), 10);
    expect(currentVal).toBe(step.expected);
    history.push({ step: step.step, action: step.action, observed: currentVal, expected: step.expected });
  }

  await context.close();
  return { history, pageErrors, consoleErrors };
}

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51731, host: 'localhost' },
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Server listening on ${baseUrl}`);

  console.log('Launching Playwright Chromium browser...');
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('Executing Run 1 (isolated context)...');
    const run1 = await executeRun(browser, baseUrl, 'run1');

    console.log('Executing Run 2 (isolated context)...');
    const run2 = await executeRun(browser, baseUrl, 'run2');

    // Assert both runs agree exactly
    console.log('Asserting that both independent runs agree...');
    expect(run1.history).toEqual(run2.history);

    // Verify contract specifically: two increments then one decrement yields 1
    const incTwoDecOne = run1.history.find((s) => s.action === 'decrement_once');
    expect(incTwoDecOne.observed).toBe(1);

    // Verify zero lower bound
    const decAtZero = run1.history.find((s) => s.action === 'decrement_at_zero');
    expect(decAtZero.observed).toBe(0);

    const allPageErrors = [...run1.pageErrors, ...run2.pageErrors];
    const allConsoleErrors = [...run1.consoleErrors, ...run2.consoleErrors];
    if (allPageErrors.length > 0 || allConsoleErrors.length > 0) {
      throw new Error(`Unexpected errors observed: ${JSON.stringify({ allPageErrors, allConsoleErrors })}`);
    }

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T055',
      title: 'Day 8: state updates — deterministic fixture lab',
      passed: true,
      timestamp: new Date().toISOString(),
      toolVersions: {
        node: process.version,
        playwright: '1.48.2',
        react: '18.3.1',
        vite: '5.4.10'
      },
      fixtureStepsCount: FIXTURE_ACTIONS.length,
      run1: run1.history,
      run2: run2.history,
      runsAgree: true,
      errors: {
        pageErrors: allPageErrors,
        consoleErrors: allConsoleErrors
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T055/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
