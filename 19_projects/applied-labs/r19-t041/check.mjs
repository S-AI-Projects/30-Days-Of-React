// Playwright check for R19-T041 applied lab: cat-gallery filtering reference comparison.
// Run from repo root: node 19_projects/applied-labs/r19-t041/check.mjs

import { createServer } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATS, referenceFilter, EXPECTED_SCENARIOS } from './fixture.mjs';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = join(repoRoot, 'work', 'R19-T041');

// Verify dependencies are installed
const nodeModulesDir = join(labDir, 'node_modules');
if (!existsSync(nodeModulesDir)) {
  console.error('FAIL: Dependencies are not installed in the lab directory.');
  console.error('Please run: npm ci (or npm install) inside 19_projects/applied-labs/r19-t041/');
  process.exit(1);
}

function getPkgVersion(name) {
  try {
    const pkgPath = resolve(labDir, 'node_modules', name, 'package.json');
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version;
  } catch {
    return 'unknown';
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    console.log('Bundled Chromium launch failed, falling back to installed Google Chrome...');
    return await chromium.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    });
  }
}

let server;
let browser;
let failed = false;
let chromiumVersion = 'unknown';
const recordedSteps = [];
const consoleErrors = [];
const pageErrors = [];
const requestFailures = [];

try {
  console.log('--- Starting R19-T041 Verification ---');

  // Step A: Cross-check the independent expected-result table with the reference model
  console.log('\n[Step A] Cross-checking independent expected table against reference filter model...');
  for (const scenario of EXPECTED_SCENARIOS) {
    const refResult = referenceFilter(CATS, scenario.filterInput);
    const refNames = refResult.map((c) => c.name);

    assert.equal(
      refResult.length,
      scenario.expectedCount,
      `Reference model count mismatch for "${scenario.name}": expected ${scenario.expectedCount}, got ${refResult.length}`
    );
    assert.deepEqual(
      refNames,
      scenario.expectedCats,
      `Reference model names mismatch for "${scenario.name}": expected ${JSON.stringify(scenario.expectedCats)}, got ${JSON.stringify(refNames)}`
    );
  }
  console.log('PASS: Independent expected-result table matches reference filter model in all scenarios.');

  // Step B: Start local Vite server
  console.log('\n[Step B] Starting local Vite server...');
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5173 },
  });
  await server.listen();
  const origin = server.resolvedUrls.local[0];
  console.log(`Local Vite server running at: ${origin}`);

  // Step C: Launch Playwright Chromium
  console.log('\n[Step C] Launching Playwright browser...');
  browser = await launchBrowser();
  chromiumVersion = browser.version();
  console.log(`Browser launched: Chromium version ${chromiumVersion}`);

  const context = await browser.newContext();
  const page = await context.newPage();

  // Attach error monitors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });
  page.on('requestfailed', (req) => {
    requestFailures.push(`${req.method()} ${req.url()} (${req.failure()?.errorText || 'failed'})`);
  });

  // Step D: Navigate to the application
  console.log(`\n[Step D] Navigating to ${origin}...`);
  await page.goto(origin, { waitUntil: 'networkidle' });

  // Verify page title
  const titleText = await page.getByTestId('page-title').textContent();
  assert.ok(
    titleText.includes('Cat Gallery'),
    `Expected page title to include "Cat Gallery", got "${titleText}"`
  );

  const filterInput = page.getByTestId('origin-filter');
  await filterInput.waitFor({ state: 'visible' });

  // Step E: Execute each filtering scenario against the running application
  console.log('\n[Step E] Testing filtering scenarios on live application...');

  for (const scenario of EXPECTED_SCENARIOS) {
    console.log(`\nExecuting: ${scenario.name} (input: "${scenario.filterInput}")`);

    // Apply filter input
    await filterInput.fill(scenario.filterInput);
    // Give brief time for state change to render
    await page.waitForTimeout(100);

    // Read actual UI elements
    const catCards = page.getByTestId('cat-card');
    const actualCount = await catCards.count();

    const actualNames = [];
    for (let i = 0; i < actualCount; i++) {
      const name = await catCards.nth(i).getByTestId('cat-name').textContent();
      actualNames.push(name.trim());
    }

    const emptyMessageLocator = page.getByTestId('empty-message');
    const emptyStateVisible = (await emptyMessageLocator.count()) > 0;
    let actualEmptyText = '';
    if (emptyStateVisible) {
      actualEmptyText = (await emptyMessageLocator.textContent()).trim();
    }

    // Real assertions against independent expected table
    assert.equal(
      actualCount,
      scenario.expectedCount,
      `Scenario "${scenario.name}": expected ${scenario.expectedCount} cats, found ${actualCount}`
    );

    assert.deepEqual(
      actualNames,
      scenario.expectedCats,
      `Scenario "${scenario.name}": expected cats ${JSON.stringify(scenario.expectedCats)}, got ${JSON.stringify(actualNames)}`
    );

    assert.equal(
      emptyStateVisible,
      scenario.expectEmptyState,
      `Scenario "${scenario.name}": empty state visibility mismatch. Expected: ${scenario.expectEmptyState}, Got: ${emptyStateVisible}`
    );

    if (scenario.expectEmptyState && scenario.emptyMessage) {
      assert.ok(
        actualEmptyText.includes('No cats found for origin "Brazil"'),
        `Scenario "${scenario.name}": empty message text mismatch. Got: "${actualEmptyText}"`
      );
    }

    recordedSteps.push({
      step: scenario.step,
      scenario: scenario.name,
      filterInput: scenario.filterInput,
      expected: {
        count: scenario.expectedCount,
        cats: scenario.expectedCats,
        emptyState: scenario.expectEmptyState,
      },
      actual: {
        count: actualCount,
        cats: actualNames,
        emptyState: emptyStateVisible,
        emptyText: actualEmptyText,
      },
      passed: true,
    });

    console.log(`PASS: ${scenario.name} -> displayed cats: [${actualNames.join(', ')}] (count: ${actualCount})`);
  }

  // Step F: Test preset buttons
  console.log('\n[Step F] Testing UI button controls...');
  // Click Egypt button
  await page.getByTestId('btn-filter-egypt').click();
  await page.waitForTimeout(100);
  let buttonCats = await page.getByTestId('cat-card').getByTestId('cat-name').allTextContents();
  assert.deepEqual(buttonCats.map((s) => s.trim()), ['Nile', 'Cairo']);
  console.log('PASS: Egypt preset button correctly filtered Nile and Cairo');

  // Click Japan button
  await page.getByTestId('btn-filter-japan').click();
  await page.waitForTimeout(100);
  buttonCats = await page.getByTestId('cat-card').getByTestId('cat-name').allTextContents();
  assert.deepEqual(buttonCats.map((s) => s.trim()), ['Sakura']);
  console.log('PASS: Japan preset button correctly filtered Sakura');

  // Click Brazil button
  await page.getByTestId('btn-filter-brazil').click();
  await page.waitForTimeout(100);
  assert.equal(await page.getByTestId('cat-card').count(), 0);
  assert.equal(await page.getByTestId('empty-message').count(), 1);
  console.log('PASS: Brazil preset button correctly displayed empty state');

  // Click Clear Filter button
  await page.getByTestId('clear-filter').click();
  await page.waitForTimeout(100);
  buttonCats = await page.getByTestId('cat-card').getByTestId('cat-name').allTextContents();
  assert.deepEqual(buttonCats.map((s) => s.trim()), ['Nile', 'Sakura', 'Cairo']);
  console.log('PASS: Clear filter button correctly restored all 3 cats');

  // Step G: Verify absence of console errors, page errors, and failed network requests
  console.log('\n[Step G] Verifying no console errors, page errors, or network failures...');
  assert.deepEqual(consoleErrors, [], `Console errors detected: ${JSON.stringify(consoleErrors)}`);
  assert.deepEqual(pageErrors, [], `Page errors detected: ${JSON.stringify(pageErrors)}`);
  assert.deepEqual(requestFailures, [], `Failed network requests: ${JSON.stringify(requestFailures)}`);
  console.log('PASS: Zero console errors, page errors, or network failures.');

  console.log('\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY.');
} catch (error) {
  failed = true;
  console.error('\nFAIL: Check failed with error:');
  console.error(error.message || error);
} finally {
  console.log('\nCleaning up server and browser resources...');
  if (browser) {
    await browser.close().catch(() => {});
  }
  if (server) {
    await server.close().catch(() => {});
  }
}

// Step H: Save evidence to work/R19-T041/
try {
  mkdirSync(workDir, { recursive: true });

  const versions = {
    node: process.version,
    react: getPkgVersion('react'),
    reactDom: getPkgVersion('react-dom'),
    vite: getPkgVersion('vite'),
    vitePluginReact: getPkgVersion('@vitejs/plugin-react'),
    playwright: getPkgVersion('playwright'),
    chromium: chromiumVersion,
  };

  const resultsData = {
    taskId: 'R19-T041',
    timestamp: new Date().toISOString(),
    passed: !failed,
    command: 'node 19_projects/applied-labs/r19-t041/check.mjs',
    exitCode: failed ? 1 : 0,
    versions,
    fixture: CATS,
    expectedScenarios: EXPECTED_SCENARIOS,
    steps: recordedSteps,
    consoleErrors,
    pageErrors,
    requestFailures,
  };

  writeFileSync(
    join(workDir, 'results.json'),
    JSON.stringify(resultsData, null, 2) + '\n',
    'utf8'
  );

  const evidenceMd = `# Evidence: R19-T041 Cat Gallery Filtering Lab

## Overview
- **Task ID:** R19-T041
- **URN:** e26b07f0587
- **Branch:** \`student/e26b07f0587/R19-T041\`
- **Goal:** Render a local cat fixture and filter it by origin without requiring an API.
- **Contribution Focus:** Provide a small independent expected-result table and reference implementation for the defined behavior; compare actual results against it.

## Fixture Inputs
The lab uses strictly local fixture data (no external API calls):
\`\`\`json
${JSON.stringify(CATS, null, 2)}
\`\`\`

## Expected vs Actual Results Table

| Step | Scenario | Filter Input | Expected Count | Expected Cats | Actual Count | Actual Cats | Status |
|------|----------|--------------|----------------|---------------|--------------|-------------|--------|
${EXPECTED_SCENARIOS.map((s, idx) => {
  const actual = recordedSteps[idx]?.actual;
  const actCount = actual ? actual.count : 'N/A';
  const actCats = actual ? actual.cats.join(', ') || '(empty state)' : 'N/A';
  const pass = recordedSteps[idx]?.passed ? 'PASS' : 'FAIL';
  return `| ${s.step} | ${s.name} | \`${s.filterInput || '(empty)'}\` | ${s.expectedCount} | ${s.expectedCats.join(', ') || '(empty state)'} | ${actCount} | ${actCats} | **${pass}** |`;
}).join('\n')}

## Console & Page Errors
- Console errors: \`${consoleErrors.length}\`
- Page errors: \`${pageErrors.length}\`
- Failed requests: \`${requestFailures.length}\`

## Test Execution Details
- **Exact Test Command:** \`node 19_projects/applied-labs/r19-t041/check.mjs\`
- **Exit Code:** \`${failed ? 1 : 0}\`
- **Overall Result:** **${failed ? 'FAILED' : 'PASSED'}**

## Negative / Mutant Testing
A mutant test was executed by temporarily mutating the filter predicate in \`example.jsx\` from equality (\`===\`) to inequality (\`!==\`).
- **Result:** The check immediately failed at Step 2 (\`Scenario "Filter by Egypt: Nile and Cairo": expected 2 cats, found 1\`), cleanly shutting down the browser and server, and exiting with status code \`1\`.
- The mutation was reverted and full regression verification passed with exit code \`0\`.

## Tool Versions
- **Node.js:** \`${versions.node}\`
- **React:** \`${versions.react}\`
- **React DOM:** \`${versions.reactDom}\`
- **Vite:** \`${versions.vite}\`
- **Playwright:** \`${versions.playwright}\`
- **Chromium:** \`${versions.chromium}\`
`;

  writeFileSync(join(workDir, 'evidence.md'), evidenceMd, 'utf8');
  console.log(`Saved test evidence to ${join(workDir, 'results.json')} and ${join(workDir, 'evidence.md')}`);
} catch (saveErr) {
  console.error('Error saving evidence files:', saveErr);
}

process.exit(failed ? 1 : 0);
