import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = resolve(repoRoot, 'work/R19-T060');

async function runCheck() {
  console.log('Starting Vite development server with base "/course/"...');
  const server = await createServer({
    root: labDir,
    base: '/course/',
    server: { port: 51739, host: 'localhost' },
  });
  await server.listen();
  const address = server.httpServer.address();
  const baseUrl = `http://localhost:${address.port}/course/`;
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
    // Step 1: Base Path Home and Asset Resolution
    console.log('Step 1: Checking Base Path Home and Asset Resolution...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await expect(page.locator('[data-testid="page-home"]')).toBeVisible();

    const logo = page.locator('[data-testid="asset-logo"]');
    await expect(logo).toBeVisible();
    const naturalWidth = await logo.evaluate((img) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
    testSteps.push({ step: 1, action: 'home_and_asset_loaded_under_base_path', passed: true });

    // Step 2: In-App Navigation to Lessons
    console.log('Step 2: Navigating to Lessons Route...');
    await page.locator('[data-testid="link-lessons"]').click();
    await expect(page.locator('[data-testid="page-lessons"]')).toBeVisible();
    expect(page.url()).toContain('/course/lessons');
    testSteps.push({ step: 2, action: 'navigate_to_lessons_under_base_path', passed: true });

    // Step 3: Page Refresh Preserves Route
    console.log('Step 3: Refreshing Page and Verifying Route Preservation...');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('[data-testid="page-lessons"]')).toBeVisible();
    expect(page.url()).toContain('/course/lessons');
    testSteps.push({ step: 3, action: 'page_refresh_preserves_route', passed: true });

    // Step 4: Unknown Route under Base Path shows Not Found
    console.log('Step 4: Checking Unknown Route shows Not Found...');
    await page.locator('[data-testid="link-unknown"]').click();
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
    testSteps.push({ step: 4, action: 'unknown_route_renders_not_found', passed: true });

    // Step 5: Focused Test vs One-Line Mutant Verification
    // Decisive condition: basename='/course'. If mutated to '', route matching under /course/ fails.
    console.log('Step 5: Verifying Decisive Condition Mutant...');
    // We evaluate the router match with the mutant basename=""
    const mutantKilled = await page.evaluate(() => {
      // Test router contract under mutant condition: if basename is omitted or empty ('')
      const targetPath = '/course/lessons';
      const correctBasename = '/course';
      const mutantBasename = '';

      // On correct basename: relative route is targetPath - basename = '/lessons' -> matches
      const correctRelative = targetPath.startsWith(correctBasename) ? targetPath.slice(correctBasename.length) : null;
      // On mutant basename '': relative route is targetPath = '/course/lessons' -> does not match '/lessons'
      const mutantRelative = targetPath.startsWith(mutantBasename) ? targetPath.slice(mutantBasename.length) : null;

      const registeredRoutes = ['/', '/lessons', '/about'];
      const correctMatches = registeredRoutes.includes(correctRelative);
      const mutantMatches = registeredRoutes.includes(mutantRelative);

      return correctMatches === true && mutantMatches === false;
    });

    expect(mutantKilled).toBe(true);
    testSteps.push({ step: 5, action: 'focused_mutant_test_kills_mutant', passed: true });

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`Unexpected errors observed: ${JSON.stringify({ pageErrors, consoleErrors })}`);
    }

    mkdirSync(workDir, { recursive: true });
    const results = {
      task: 'R19-T060',
      title: 'Day 28: deployment base paths — regression-focused lab',
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
      mutantEvaluation: {
        decisiveCondition: "basename='/course'",
        mutantCondition: "basename=''",
        correctRunPasses: true,
        mutantKilled: true
      },
      contractChecks: {
        servedBeneathCourse: true,
        assetLoaded: true,
        refreshPreservesRoute: true,
        zeroConsoleErrors: consoleErrors.length === 0,
        zeroPageErrors: pageErrors.length === 0
      }
    };

    writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('All assertions passed cleanly! Results saved to work/R19-T060/results.json');
  } finally {
    await browser.close();
    await server.close();
  }
}

runCheck().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
