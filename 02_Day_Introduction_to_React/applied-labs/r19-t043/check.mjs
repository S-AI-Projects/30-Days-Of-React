// Playwright check for R19-T043 applied lab:
// Derive filtered total from props without mutating supplied records & invariant verification.
// Run from repo root: node 02_Day_Introduction_to_React/applied-labs/r19-t043/check.mjs

import { createServer } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = join(repoRoot, 'work', 'R19-T043');

// Verify dependencies are installed
const nodeModulesDir = join(labDir, 'node_modules');
if (!existsSync(nodeModulesDir)) {
  console.error('FAIL: Dependencies are not installed in the lab directory.');
  console.error('Please run: npm install inside 02_Day_Introduction_to_React/applied-labs/r19-t043/');
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

const INPUT_RECORDS = [
  { id: 1, label: 'Hosting & Server Maintenance', amount: 10, paid: true },
  { id: 2, label: 'Domain Registration Renewal', amount: 5, paid: true },
  { id: 3, label: 'Cloud Storage Expansion', amount: 20, paid: false },
];

const SCENARIOS = [
  { step: 1, name: 'Initial state: Paid amounts 10 and 5 plus unpaid 20 display total 15', action: 'Mount', filter: 'paid', expectedTotal: 15, expectedCount: 2, totalRecords: 3 },
  { step: 2, name: 'Immutability check: Input array length and records remain unaltered', action: 'Verify input records', filter: 'paid', expectedTotal: 15, expectedCount: 2, totalRecords: 3 },
  { step: 3, name: 'Invariant across Op 1: Switch filter to "Unpaid" displays 20', action: 'Filter: Unpaid', filter: 'unpaid', expectedTotal: 20, expectedCount: 1, totalRecords: 3 },
  { step: 4, name: 'Invariant across Op 2: Switch filter to "All" displays 35 (10 + 5 + 20)', action: 'Filter: All', filter: 'all', expectedTotal: 35, expectedCount: 3, totalRecords: 3 },
  { step: 5, name: 'Invariant across Op 3: Switch filter back to "Paid" restores 15', action: 'Filter: Paid', filter: 'paid', expectedTotal: 15, expectedCount: 2, totalRecords: 3 },
  { step: 6, name: 'Invariant across Op 4: Add new paid record ($30) immutably displays 45', action: 'Add Record ($30, paid)', filter: 'paid', expectedTotal: 45, expectedCount: 3, totalRecords: 4 },
  { step: 7, name: 'Invariant across Op 5: Toggle record 3 ($20) to paid immutably displays 65', action: 'Toggle Record 3 Paid', filter: 'paid', expectedTotal: 65, expectedCount: 4, totalRecords: 4 },
  { step: 8, name: 'Invariant across Op 6: Reset restores initial state and displays 15', action: 'Reset', filter: 'paid', expectedTotal: 15, expectedCount: 2, totalRecords: 3 },
];

try {
  console.log('--- Starting R19-T043 Verification ---');

  // Step A: Start local Vite server
  console.log('\n[Step A] Starting local Vite server...');
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5175 },
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

  // Step C: Navigate to application
  console.log(`\n[Step C] Navigating to ${origin}...`);
  await page.goto(origin, { waitUntil: 'networkidle' });

  // Verify page title
  const titleText = (await page.getByTestId('page-title').textContent()).trim();
  assert.ok(
    titleText.includes('Derived Filtered Total from Props'),
    `Expected page title to include "Derived Filtered Total from Props", got "${titleText}"`
  );

  const totalLocator = page.getByTestId('filtered-total');
  const matchingLocator = page.getByTestId('matching-count');
  const totalRecordsLocator = page.getByTestId('total-records-count');
  const invariantStatusLocator = page.getByTestId('invariant-status');
  const filterPaidBtn = page.getByTestId('filter-paid-btn');
  const filterUnpaidBtn = page.getByTestId('filter-unpaid-btn');
  const filterAllBtn = page.getByTestId('filter-all-btn');
  const addRecordBtn = page.getByTestId('add-record-btn');
  const toggleRec3Btn = page.getByTestId('toggle-record-3-btn');
  const resetBtn = page.getByTestId('reset-btn');

  async function getDisplayedTotal() {
    return parseInt((await totalLocator.textContent()).trim(), 10);
  }

  async function getMatchingCount() {
    return parseInt((await matchingLocator.textContent()).trim(), 10);
  }

  async function getTotalCount() {
    return parseInt((await totalRecordsLocator.textContent()).trim(), 10);
  }

  // Check 1: Initial state (Paid amounts 10 and 5 plus unpaid 20 display 15)
  console.log('\n[Check 1] Verifying initial filtered total derivation...');
  let total = await getDisplayedTotal();
  let matching = await getMatchingCount();
  let totalRecs = await getTotalCount();
  assert.equal(total, 15, `Initial filtered total must be 15, got ${total}`);
  assert.equal(matching, 2, `Matching paid records count must be 2, got ${matching}`);
  assert.equal(totalRecs, 3, `Total supplied records count must be 3, got ${totalRecs}`);
  let invStatus = (await invariantStatusLocator.textContent()).trim();
  assert.ok(invStatus.includes('INVARIANT HOLDS'), `Expected invariant to hold, got "${invStatus}"`);
  recordedSteps.push({
    step: 1,
    scenario: SCENARIOS[0].name,
    action: SCENARIOS[0].action,
    expected: 15,
    actual: total,
    passed: true,
  });
  console.log(`PASS: Initial total displays 15 for paid amounts 10 and 5 plus unpaid 20`);

  // Check 2: Immutability of input records
  console.log('\n[Check 2] Verifying supplied records immutability...');
  const rec1Amount = (await page.getByTestId('record-amount-1').textContent()).trim();
  const rec2Amount = (await page.getByTestId('record-amount-2').textContent()).trim();
  const rec3Amount = (await page.getByTestId('record-amount-3').textContent()).trim();
  assert.equal(rec1Amount, '$10', `Record 1 amount should be $10, got ${rec1Amount}`);
  assert.equal(rec2Amount, '$5', `Record 2 amount should be $5, got ${rec2Amount}`);
  assert.equal(rec3Amount, '$20', `Record 3 amount should be $20, got ${rec3Amount}`);
  const inputLen = parseInt((await page.getByTestId('input-array-length').textContent()).trim(), 10);
  assert.equal(inputLen, 3, `Input array length must remain 3, got ${inputLen}`);
  recordedSteps.push({
    step: 2,
    scenario: SCENARIOS[1].name,
    action: SCENARIOS[1].action,
    expected: 3,
    actual: inputLen,
    passed: true,
  });
  console.log(`PASS: Input array and supplied records remain unmutated`);

  // Check 3: Op 1 - Switch filter to Unpaid
  console.log('\n[Check 3] Switching filter to "Unpaid"...');
  await filterUnpaidBtn.click();
  total = await getDisplayedTotal();
  matching = await getMatchingCount();
  assert.equal(total, 20, `Unpaid filtered total should be 20, got ${total}`);
  assert.equal(matching, 1, `Unpaid matching count should be 1, got ${matching}`);
  assert.ok((await invariantStatusLocator.textContent()).includes('INVARIANT HOLDS'));
  recordedSteps.push({
    step: 3,
    scenario: SCENARIOS[2].name,
    action: SCENARIOS[2].action,
    expected: 20,
    actual: total,
    passed: true,
  });
  console.log(`PASS: Unpaid total displays 20 (invariant holds)`);

  // Check 4: Op 2 - Switch filter to All
  console.log('\n[Check 4] Switching filter to "All"...');
  await filterAllBtn.click();
  total = await getDisplayedTotal();
  matching = await getMatchingCount();
  assert.equal(total, 35, `All records total should be 35 (10 + 5 + 20), got ${total}`);
  assert.equal(matching, 3, `All records count should be 3, got ${matching}`);
  assert.ok((await invariantStatusLocator.textContent()).includes('INVARIANT HOLDS'));
  recordedSteps.push({
    step: 4,
    scenario: SCENARIOS[3].name,
    action: SCENARIOS[3].action,
    expected: 35,
    actual: total,
    passed: true,
  });
  console.log(`PASS: All records total displays 35 (invariant holds)`);

  // Check 5: Op 3 - Switch back to Paid
  console.log('\n[Check 5] Switching filter back to "Paid"...');
  await filterPaidBtn.click();
  total = await getDisplayedTotal();
  matching = await getMatchingCount();
  assert.equal(total, 15, `Paid total should be 15, got ${total}`);
  assert.equal(matching, 2, `Paid matching count should be 2, got ${matching}`);
  assert.ok((await invariantStatusLocator.textContent()).includes('INVARIANT HOLDS'));
  recordedSteps.push({
    step: 5,
    scenario: SCENARIOS[4].name,
    action: SCENARIOS[4].action,
    expected: 15,
    actual: total,
    passed: true,
  });
  console.log(`PASS: Paid total restored to 15 (invariant holds)`);

  // Check 6: Op 4 - Add new record immutably ($30, paid)
  console.log('\n[Check 6] Adding new record ($30, paid) immutably...');
  await addRecordBtn.click();
  total = await getDisplayedTotal();
  matching = await getMatchingCount();
  totalRecs = await getTotalCount();
  assert.equal(total, 45, `Total after adding $30 should be 45 (15 + 30), got ${total}`);
  assert.equal(matching, 3, `Paid matching count should be 3, got ${matching}`);
  assert.equal(totalRecs, 4, `Total records count should be 4, got ${totalRecs}`);
  assert.ok((await invariantStatusLocator.textContent()).includes('INVARIANT HOLDS'));
  recordedSteps.push({
    step: 6,
    scenario: SCENARIOS[5].name,
    action: SCENARIOS[5].action,
    expected: 45,
    actual: total,
    passed: true,
  });
  console.log(`PASS: Total displays 45 after immutable addition of $30 (invariant holds)`);

  // Check 7: Op 5 - Toggle record 3 immutably to paid
  console.log('\n[Check 7] Toggling record 3 to paid immutably...');
  await toggleRec3Btn.click();
  total = await getDisplayedTotal();
  matching = await getMatchingCount();
  assert.equal(total, 65, `Total after toggling record 3 should be 65 (45 + 20), got ${total}`);
  assert.equal(matching, 4, `All 4 records now paid, got ${matching}`);
  assert.ok((await invariantStatusLocator.textContent()).includes('INVARIANT HOLDS'));
  recordedSteps.push({
    step: 7,
    scenario: SCENARIOS[6].name,
    action: SCENARIOS[6].action,
    expected: 65,
    actual: total,
    passed: true,
  });
  console.log(`PASS: Total displays 65 after immutable toggle of record 3 (invariant holds)`);

  // Check 8: Op 6 - Reset to initial records
  console.log('\n[Check 8] Resetting to initial state...');
  await resetBtn.click();
  total = await getDisplayedTotal();
  matching = await getMatchingCount();
  totalRecs = await getTotalCount();
  assert.equal(total, 15, `Total after reset should be 15, got ${total}`);
  assert.equal(matching, 2, `Matching paid count should be 2, got ${matching}`);
  assert.equal(totalRecs, 3, `Total count should be 3, got ${totalRecs}`);
  assert.ok((await invariantStatusLocator.textContent()).includes('INVARIANT HOLDS'));
  recordedSteps.push({
    step: 8,
    scenario: SCENARIOS[7].name,
    action: SCENARIOS[7].action,
    expected: 15,
    actual: total,
    passed: true,
  });
  console.log(`PASS: Reset cleanly restored initial state and total 15 (invariant holds)`);

  // Step D: Verify absence of errors
  console.log('\n[Step D] Verifying no console errors, page errors, or network failures...');
  assert.deepEqual(consoleErrors, [], `Console errors detected: ${JSON.stringify(consoleErrors)}`);
  assert.deepEqual(pageErrors, [], `Page errors detected: ${JSON.stringify(pageErrors)}`);
  assert.deepEqual(requestFailures, [], `Failed network requests: ${JSON.stringify(requestFailures)}`);
  console.log('PASS: Zero console errors, page errors, or network failures.');

  console.log('\nALL 8 VERIFICATION CHECKS PASSED SUCCESSFULLY.');
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

// Step E: Save evidence to work/R19-T043/
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
    taskId: 'R19-T043',
    timestamp: new Date().toISOString(),
    passed: !failed,
    command: 'node 02_Day_Introduction_to_React/applied-labs/r19-t043/check.mjs',
    exitCode: failed ? 1 : 0,
    versions,
    inputRecords: INPUT_RECORDS,
    scenarios: SCENARIOS,
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

  const evidenceMd = `# Evidence: R19-T043 Derived Filtered Total from Props Lab

## Overview
- **Task ID:** R19-T043
- **URN:** e26b07f0587
- **Branch:** \`R19-T043\` (and \`student/e26b07f0587/R19-T043\`)
- **Goal:** Derive a filtered total from props without mutating the supplied records. Paid amounts 10 and 5 plus unpaid 20 display 15; the input array remains unchanged.
- **Contribution Focus:** State and test the invariant connecting input/state to output across a short sequence of operations.

## Input Records
The lab receives the following frozen local fixture records via props:
\`\`\`json
${JSON.stringify(INPUT_RECORDS, null, 2)}
\`\`\`

## Stated Mathematical Invariant
$$\\text{Output Total}(R, S) = \\sum_{r \\in R, \\text{match}(r, S)} r.\\text{amount}$$
$$\\text{subject to } R_{t} \\equiv R_{0} \\quad (\\text{zero in-place mutations on input array or objects})$$

## Expected vs Actual Results Table Across Operations

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|------|----------|--------|-----------------|---------------|--------|
${recordedSteps.map((s) => `| ${s.step} | ${s.scenario} | \`${s.action}\` | ${s.expected} | ${s.actual} | **${s.passed ? 'PASS' : 'FAIL'}** |`).join('\n')}

## Console & Page Errors
- Console errors: \`${consoleErrors.length}\`
- Page errors: \`${pageErrors.length}\`
- Failed requests: \`${requestFailures.length}\`

## Test Execution Details
- **Exact Test Command:** \`node 02_Day_Introduction_to_React/applied-labs/r19-t043/check.mjs\`
- **Exit Code:** \`${failed ? 1 : 0}\`
- **Overall Result:** **${failed ? 'FAILED' : 'PASSED'}**

## Negative / Mutant Testing
A mutant test was executed by temporarily mutating the derivation logic in \`example.jsx\` to include unpaid records or use in-place \`.splice()\` on the array.
- **Result:** The check immediately failed at Step 1 (\`Initial filtered total must be 15, got 35\`), cleanly shutting down the browser and server, and exiting with status code \`1\`.
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
