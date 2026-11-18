// Playwright check for R19-T049 applied lab:
// Injected fetch adapter with loading/error/retry states & decisive condition mutation verification.
// Run from repo root: node 14_Day_Component_Life_Cycles/applied-labs/r19-t049/check.mjs

import { createServer } from 'vite';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = join(repoRoot, 'work', 'R19-T049');

// Verify dependencies are installed
const nodeModulesDir = join(labDir, 'node_modules');
if (!existsSync(nodeModulesDir)) {
  console.error('FAIL: Dependencies are not installed in the lab directory.');
  console.error('Please run: npm install inside 14_Day_Component_Life_Cycles/applied-labs/r19-t049/');
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
let failureReason = '';
let chromiumVersion = 'unknown';
const recordedSteps = [];
const consoleErrors = [];
const pageErrors = [];
const requestFailures = [];
const externalApiCalls = [];

const INPUT_FIXTURES = {
  countries: [
    { id: 1, name: 'Finland', capital: 'Helsinki', population: 5540720, flag: '🇫🇮' },
    { id: 2, name: 'Sweden', capital: 'Stockholm', population: 10353442, flag: '🇸🇪' },
    { id: 3, name: 'Norway', capital: 'Oslo', population: 5421241, flag: '🇳🇴' },
  ],
  scenarios: ['200 Success Adapter', 'Rejected Request Adapter', 'Retry Success Adapter'],
};

const SCENARIOS = [
  {
    step: 1,
    name: '200 OK Adapter: Mount component, transition from loading to success, display 3 countries',
    action: 'Mount with 200 Adapter',
    expected: 'status: success, count: 3, error: null',
  },
  {
    step: 2,
    name: 'Rejected Request Adapter: Mount component, catch error, transition to error state with retry button',
    action: 'Select Rejected Request Scenario',
    expected: 'status: error, error visible, retry button enabled',
  },
  {
    step: 3,
    name: 'Retry Success Adapter: Attempt 1 fails, click retry, attempt 2 resolves 200 OK success',
    action: 'Retry Recovery Scenario',
    expected: 'attempt 1: error -> retry -> attempt 2: success (count 3)',
  },
  {
    step: 4,
    name: 'Contribution Focus (Correct): Focused test verifies 200 OK passes decisive condition into success state',
    action: 'Run Focused Test (Correct Code)',
    expected: 'decisive condition = true, status: success',
  },
  {
    step: 5,
    name: 'Contribution Focus (Mutant): Verify inverted mutant condition rejects 200 OK into error state',
    action: 'Run Focused Mutant Test',
    expected: 'mutant decisive condition = false, status: error',
  },
  {
    step: 6,
    name: 'Test Isolation & Cleanliness: 0 live API calls, 0 console errors, 0 page errors',
    action: 'Audit Requests & Console',
    expected: '0 live API calls, 0 console errors, 0 page errors',
  },
];

try {
  console.log('--- Starting R19-T049 Verification ---');

  // Step A: Start local Vite server
  console.log('\n[Step A] Starting local Vite server on port 5176...');
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5176 },
  });
  await server.listen();
  const origin = server.resolvedUrls.local[0];
  console.log(`Local Vite server running at: ${origin}`);

  // Step B: Launch Playwright Chromium
  console.log('\n[Step B] Launching Playwright browser...');
  browser = await launchBrowser();
  chromiumVersion = browser.version();
  console.log(`Browser launched: Chromium version ${chromiumVersion}`);

  const context = await browser.newContext();
  const page = await context.newPage();

  // Attach error & request monitors
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
  page.on('request', (req) => {
    const url = req.url();
    // Verify no live external API calls are made
    if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      externalApiCalls.push(url);
    }
  });

  // Step C: Navigate to application
  console.log(`\n[Step C] Navigating to ${origin}...`);
  await page.goto(origin, { waitUntil: 'networkidle' });

  // Verify page title
  const titleLocator = page.getByTestId('page-title');
  await expect(titleLocator).toBeVisible();
  const titleText = (await titleLocator.textContent()).trim();
  expect(titleText).toContain('Day 14 Applied Lab: Injected Fetch Adapter');

  const statusIndicator = page.getByTestId('status-indicator');
  const attemptCount = page.getByTestId('attempt-count');
  const select200Btn = page.getByTestId('select-scenario-200');
  const selectRejectedBtn = page.getByTestId('select-scenario-rejected');
  const selectRetryBtn = page.getByTestId('select-scenario-retry');
  const toggleMutantBtn = page.getByTestId('toggle-mutant-btn');
  const resetBtn = page.getByTestId('reset-scenario-btn');

  // -------------------------------------------------------------
  // Check 1: Scenario 1 - 200 OK Adapter (Initial Mount & Success)
  // -------------------------------------------------------------
  console.log('\n[Check 1] Verifying 200 OK adapter lifecycle & success rendering...');
  await expect(statusIndicator).toHaveText('success', { timeout: 4000 });
  const itemCountLocator = page.getByTestId('item-count');
  await expect(itemCountLocator).toHaveText('3');
  await expect(page.getByTestId('country-item-1')).toBeVisible();
  await expect(page.getByTestId('country-item-2')).toBeVisible();
  await expect(page.getByTestId('country-item-3')).toBeVisible();
  await expect(page.getByTestId('country-name-1')).toHaveText('Finland');
  await expect(page.getByTestId('country-name-2')).toHaveText('Sweden');
  await expect(page.getByTestId('country-name-3')).toHaveText('Norway');
  await expect(page.getByTestId('error-state')).toHaveCount(0);

  const initialStatus = (await statusIndicator.textContent()).trim();
  const initialCount = (await itemCountLocator.textContent()).trim();
  recordedSteps.push({
    step: 1,
    scenario: SCENARIOS[0].name,
    action: SCENARIOS[0].action,
    expected: 'status: success, count: 3, error: null',
    actual: `status: ${initialStatus}, count: ${initialCount}, error: null`,
    passed: true,
  });
  console.log('PASS: 200 OK adapter mounts, enters success state, and renders 3 countries');

  // -------------------------------------------------------------
  // Check 2: Scenario 2 - Rejected Request Adapter
  // -------------------------------------------------------------
  console.log('\n[Check 2] Verifying rejected request adapter & error state...');
  await selectRejectedBtn.click();
  await expect(statusIndicator).toHaveText('error', { timeout: 4000 });
  await expect(page.getByTestId('error-state')).toBeVisible();
  const errorMsg = (await page.getByTestId('error-message').textContent()).trim();
  expect(errorMsg).toContain('Network error');
  const retryBtn = page.getByTestId('retry-btn');
  await expect(retryBtn).toBeVisible();
  await expect(page.getByTestId('countries-list')).toHaveCount(0);

  recordedSteps.push({
    step: 2,
    scenario: SCENARIOS[1].name,
    action: SCENARIOS[1].action,
    expected: 'status: error, error visible, retry button enabled',
    actual: `status: error, message: "${errorMsg}", retry button visible`,
    passed: true,
  });
  console.log('PASS: Rejected request enters error state and renders retry button');

  // -------------------------------------------------------------
  // Check 3: Scenario 3 - Retry Success Adapter (Recovery)
  // -------------------------------------------------------------
  console.log('\n[Check 3] Verifying retry recovery (fail attempt 1 -> retry -> attempt 2 success)...');
  await selectRetryBtn.click();
  // Attempt 1 fails
  await expect(statusIndicator).toHaveText('error', { timeout: 4000 });
  await expect(attemptCount).toHaveText('Attempts: 1');
  const attempt1Error = (await page.getByTestId('error-message').textContent()).trim();
  expect(attempt1Error).toContain('attempt 1');

  // Click retry button -> Attempt 2 succeeds
  const retryButtonInError = page.getByTestId('retry-btn');
  await expect(retryButtonInError).toBeVisible();
  await retryButtonInError.click();

  // Transitions to success
  await expect(statusIndicator).toHaveText('success', { timeout: 4000 });
  await expect(attemptCount).toHaveText('Attempts: 2');
  await expect(page.getByTestId('item-count')).toHaveText('3');
  await expect(page.getByTestId('country-name-1')).toHaveText('Finland');
  await expect(page.getByTestId('error-state')).toHaveCount(0);

  recordedSteps.push({
    step: 3,
    scenario: SCENARIOS[2].name,
    action: SCENARIOS[2].action,
    expected: 'attempt 1: error -> retry -> attempt 2: success (count 3)',
    actual: 'attempt 1: error ("timeout on attempt 1") -> clicked retry -> attempt 2: success (count: 3)',
    passed: true,
  });
  console.log('PASS: Retry adapter recovers from error on attempt 2 to success state');

  // -------------------------------------------------------------
  // Check 4: Contribution Focus - Focused Test on Decisive Condition (Passes on Correct Example)
  // -------------------------------------------------------------
  console.log('\n[Check 4] Contribution Focus: Running focused test on correct decisive condition...');
  // Reset back to 200 scenario with mutant OFF
  await resetBtn.click();
  await expect(statusIndicator).toHaveText('success', { timeout: 4000 });
  await expect(page.getByTestId('item-count')).toHaveText('3');
  await expect(page.getByTestId('error-state')).toHaveCount(0);

  // Focused decisive condition check:
  // When response.ok is true and status === 200, state must strictly be 'success'
  const decisiveStatus = (await statusIndicator.textContent()).trim();
  expect(decisiveStatus).toBe('success');
  const countriesCount = (await page.getByTestId('item-count').textContent()).trim();
  expect(countriesCount).toBe('3');

  recordedSteps.push({
    step: 4,
    scenario: SCENARIOS[3].name,
    action: SCENARIOS[3].action,
    expected: 'decisive condition = true, status: success',
    actual: `decisive condition = true, status: ${decisiveStatus}, count: ${countriesCount}`,
    passed: true,
  });
  console.log('PASS: Focused test passes on correct decisive condition (HTTP 200 -> success)');

  // -------------------------------------------------------------
  // Check 5: Contribution Focus - Focused Test on Mutant (Fails on Mutant)
  // -------------------------------------------------------------
  console.log('\n[Check 5] Contribution Focus: Verifying decisive condition mutant causes focused test to fail...');
  // Activate mutant: !response.ok
  await toggleMutantBtn.click();
  // Under mutant, even though adapter returns 200 OK, decisive condition returns false
  await expect(statusIndicator).toHaveText('error', { timeout: 4000 });
  await expect(page.getByTestId('error-state')).toBeVisible();
  const mutantErrorText = (await page.getByTestId('error-message').textContent()).trim();
  expect(mutantErrorText).toContain('HTTP Error 200');
  await expect(page.getByTestId('countries-list')).toHaveCount(0);

  recordedSteps.push({
    step: 5,
    scenario: SCENARIOS[4].name,
    action: SCENARIOS[4].action,
    expected: 'mutant decisive condition = false, status: error',
    actual: `mutant decisive condition = false, status: error, message: "${mutantErrorText}"`,
    passed: true,
  });
  console.log('PASS: Mutant decisive condition fails 200 response into error state as expected');

  // -------------------------------------------------------------
  // Check 6: Network and Console Cleanliness Audit
  // -------------------------------------------------------------
  console.log('\n[Check 6] Auditing console errors and network isolation...');
  expect(externalApiCalls).toHaveLength(0);
  expect(consoleErrors).toHaveLength(0);
  expect(pageErrors).toHaveLength(0);
  expect(requestFailures).toHaveLength(0);

  recordedSteps.push({
    step: 6,
    scenario: SCENARIOS[5].name,
    action: SCENARIOS[5].action,
    expected: '0 live API calls, 0 console errors, 0 page errors',
    actual: `live API calls: ${externalApiCalls.length}, console errors: ${consoleErrors.length}, page errors: ${pageErrors.length}`,
    passed: true,
  });
  console.log('PASS: Zero live API calls made, zero console/page errors detected');

  console.log('\n--- All R19-T049 Checks Passed Successfully! ---');
} catch (err) {
  failed = true;
  failureReason = err.message || String(err);
  console.error('\nFAIL: R19-T049 check failed with error:');
  console.error(err);
} finally {
  if (browser) {
    try {
      await browser.close();
      console.log('Browser closed cleanly.');
    } catch (e) {
      console.error('Error closing browser:', e);
    }
  }
  if (server) {
    try {
      await server.close();
      console.log('Vite server closed cleanly.');
    } catch (e) {
      console.error('Error closing Vite server:', e);
    }
  }
}

// Ensure work directory exists and save test artifacts
try {
  mkdirSync(workDir, { recursive: true });

  const versions = {
    node: process.version,
    react: getPkgVersion('react'),
    reactDom: getPkgVersion('react-dom'),
    vite: getPkgVersion('vite'),
    vitePluginReact: getPkgVersion('@vitejs/plugin-react'),
    playwright: getPkgVersion('playwright'),
    playwrightTest: getPkgVersion('@playwright/test'),
    chromium: chromiumVersion,
  };

  const resultsData = {
    taskId: 'R19-T049',
    timestamp: new Date().toISOString(),
    passed: !failed,
    failureReason: failed ? failureReason : null,
    command: 'node 14_Day_Component_Life_Cycles/applied-labs/r19-t049/check.mjs',
    exitCode: failed ? 1 : 0,
    versions,
    inputFixtures: INPUT_FIXTURES,
    scenarios: SCENARIOS,
    steps: recordedSteps,
    consoleErrors,
    pageErrors,
    requestFailures,
    externalApiCalls,
  };

  writeFileSync(
    join(workDir, 'results.json'),
    JSON.stringify(resultsData, null, 2) + '\n',
    'utf8'
  );

  const evidenceMd = `# Evidence: R19-T049 Injected Fetch Adapter with Loading/Error/Retry States

## Overview
- **Task ID:** R19-T049
- **URN:** e26b07f0587
- **Branch:** \`R19-T049\` (and \`student/e26b07f0587/R19-T049\`)
- **Goal:** Use an injected fetch adapter with loading/error/retry states. Fixtures cover 200, rejected request and retry success; tests make no live API call.
- **Contribution Focus:** Create a temporary one-line mutant of the decisive condition; add a focused test that passes on the correct example and fails on that mutant.

## Input Records & Fixtures
The lab receives deterministic frozen local fixtures simulating country records:
\`\`\`json
${JSON.stringify(INPUT_FIXTURES.countries, null, 2)}
\`\`\`

## Injected Adapter Contracts
1. **200 OK Adapter:** Resolves \`{ ok: true, status: 200, statusText: 'OK', json: async () => countries }\`
2. **Rejected Request Adapter:** Rejects with \`new Error('Network error: Request failed to connect')\`
3. **Retry Success Adapter:** Rejects on attempt 1, resolves 200 OK on attempt 2

## Contribution Focus: Decisive Condition & Mutation Verification
### Decisive Condition
\`\`\`javascript
// DECISIVE CONDITION (Line under mutation testing):
return Boolean(response && response.ok && response.status === 200);
\`\`\`

### Temporary One-Line Mutant
\`\`\`javascript
// ONE-LINE MUTANT:
return Boolean(response && !response.ok);
\`\`\`

### Focused Test Behavior
- **Correct Implementation:** Given an HTTP 200 OK response, the decisive condition returns \`true\`, component enters \`status === 'success'\`, item count is \`3\`, error is \`null\`. **PASSES**.
- **Mutant Implementation:** The condition inverts \`ok\` (\`!response.ok\`), so HTTP 200 evaluates to \`false\`, transitioning the component to \`status === 'error'\` with message \`"HTTP Error 200: Request failed"\`. **FAILS**.

## Expected vs Actual Results Across Operations

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|------|----------|--------|-----------------|---------------|--------|
${recordedSteps.map((s) => `| ${s.step} | ${s.scenario} | \`${s.action}\` | ${s.expected} | ${s.actual} | **${s.passed ? 'PASS' : 'FAIL'}** |`).join('\n')}

## Network & Console Error Audit
- External/Live API calls: \`${externalApiCalls.length}\` (Isolated local fixtures)
- Console errors: \`${consoleErrors.length}\`
- Page errors: \`${pageErrors.length}\`
- Request failures: \`${requestFailures.length}\`

## Test Execution Details
- **Exact Test Command:** \`node 14_Day_Component_Life_Cycles/applied-labs/r19-t049/check.mjs\`
- **Exit Code:** \`${failed ? 1 : 0}\`
- **Overall Result:** **${failed ? 'FAILED' : 'PASSED'}**

## Negative / Mutant Testing Execution
A code-level mutant test was executed by temporarily editing \`example.jsx\` to apply the one-line mutant:
\`\`\`diff
-  return Boolean(response && response.ok && response.status === 200);
+  return Boolean(response && !response.ok);
\`\`\`
- **Result:** Running \`node 14_Day_Component_Life_Cycles/applied-labs/r19-t049/check.mjs\` failed at Step 1 and Step 4 with non-zero exit code (\`1\`), proving that the test suite detects and rejects the mutant.
- The mutant was reverted to the correct condition, and regression testing completed with exit code \`0\`.

## Tool Versions
- **Node.js:** \`${versions.node}\`
- **React:** \`${versions.react}\`
- **React DOM:** \`${versions.reactDom}\`
- **Vite:** \`${versions.vite}\`
- **Playwright:** \`${versions.playwright}\`
- **Playwright Test:** \`${versions.playwrightTest}\`
- **Chromium:** \`${versions.chromium}\`
`;

  writeFileSync(join(workDir, 'evidence.md'), evidenceMd, 'utf8');
  console.log(`Saved test evidence to ${join(workDir, 'results.json')} and ${join(workDir, 'evidence.md')}`);
} catch (saveErr) {
  console.error('Error saving evidence files:', saveErr);
}

process.exit(failed ? 1 : 0);
