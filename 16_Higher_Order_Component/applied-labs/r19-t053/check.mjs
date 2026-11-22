import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFERENCE_TABLE } from './reference.mjs';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T053');

async function runCheck() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    root: labDir,
    server: { port: 51734, host: 'localhost' },
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

  const observedSteps = [];

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    for (const refStep of REFERENCE_TABLE) {
      console.log(`Executing step ${refStep.step}: ${refStep.action}...`);
      if (refStep.clickTarget) {
        await page.locator(`[data-testid="${refStep.clickTarget}"]`).click();
      }

      const emptyCount = await page.locator('[data-testid="detail-empty"]').count();
      const contentCount = await page.locator('[data-testid="detail-content"]').count();

      const isEmptyVisible = emptyCount > 0;
      const isDetailVisible = contentCount > 0;

      let title = '';
      let desc = '';
      if (isDetailVisible) {
        title = (await page.locator('[data-testid="detail-title"]').textContent()).trim();
        desc = (await page.locator('[data-testid="detail-desc"]').textContent()).trim();
      }

      // Assert against independent reference table
      expect(isDetailVisible).toBe(refStep.expectedDetailVisible);
      expect(isEmptyVisible).toBe(refStep.expectedEmptyVisible);
      if (refStep.expectedDetailVisible) {
        expect(title).toBe(refStep.expectedTitle);
        expect(desc).toBe(refStep.expectedContent);
      }

      observedSteps.push({
        step: refStep.step,
        action: refStep.action,
        observedDetailVisible: isDetailVisible,
        observedEmptyVisible: isEmptyVisible,
        observedTitle: title,
        observedContent: desc,
        matchedReference: true
      });
    }

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`Unexpected errors observed: ${JSON.stringify({ pageErrors, consoleErrors })}`);
    }

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T053',
      title: 'Day 16: class example integration — reference comparison lab',
      passed: true,
      timestamp: new Date().toISOString(),
      toolVersions: {
        node: process.version,
        playwright: '1.48.2',
        react: '18.3.1',
        vite: '5.4.10'
      },
      steps: observedSteps,
      referenceMatched: true,
      errors: {
        pageErrors,
        consoleErrors
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T053/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
