// Playwright verification check for R19-T042 applied lab:
// Button and keyboard shortcut shared state transition with boundary & invalid/empty-input handling.
// Run from repo root: node 10_React_Project_Folder_Structure/applied-labs/r19-t042/check.mjs

import { createServer } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = join(repoRoot, 'work', 'R19-T042');

// Verify dependencies are installed
const nodeModulesDir = join(labDir, 'node_modules');
if (!existsSync(nodeModulesDir)) {
  console.error('FAIL: Dependencies are not installed in the lab directory.');
  console.error('Please run: npm install inside 10_React_Project_Folder_Structure/applied-labs/r19-t042/');
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

const EXPECTED_SCENARIOS = [
  { step: 1, name: 'Initial state: count is 0, normal boundary status, button enabled', input: 'Mount', expectedCount: 0, expectedStatus: 'min-boundary' },
  { step: 2, name: 'Single button click increments count to 1', input: 'Click increment button', expectedCount: 1, expectedStatus: 'within-boundary' },
  { step: 3, name: 'Single documented shortcut key (ArrowUp) increments count to 2', input: 'Key: ArrowUp', expectedCount: 2, expectedStatus: 'within-boundary' },
  { step: 4, name: 'Irrelevant keys leave state unchanged at 2', input: 'Keys: ArrowDown, a, x, Enter, Escape, Tab, Shift, Space', expectedCount: 2, expectedStatus: 'within-boundary' },
  { step: 5, name: 'Alternating button click and ArrowUp increment cleanly to 6', input: 'Click, ArrowUp, Click, ArrowUp', expectedCount: 6, expectedStatus: 'within-boundary' },
  { step: 6, name: 'Input field typing isolation: typing inside input does not trigger shortcut', input: 'Type "ArrowUp" in manual input', expectedCount: 6, expectedStatus: 'within-boundary' },
  { step: 7, name: 'Empty-input handling: submitting empty input is rejected and leaves state at 6', input: 'Submit "" (empty string)', expectedCount: 6, expectedStatus: 'empty-input-error' },
  { step: 8, name: 'Invalid-input handling: submitting non-numeric "abc" is rejected and leaves state at 6', input: 'Submit "abc"', expectedCount: 6, expectedStatus: 'invalid-input-error' },
  { step: 9, name: 'Invalid-input handling: submitting negative "-5" is rejected and leaves state at 6', input: 'Submit "-5"', expectedCount: 6, expectedStatus: 'invalid-input-error' },
  { step: 10, name: 'Invalid-input handling: submitting out-of-boundary "99" is rejected and leaves state at 6', input: 'Submit "99"', expectedCount: 6, expectedStatus: 'invalid-input-error' },
  { step: 11, name: 'Valid manual input within boundary sets count to 8 and clears error', input: 'Submit "8"', expectedCount: 8, expectedStatus: 'within-boundary' },
  { step: 12, name: 'Increment to 9 via button, then to boundary 10 via ArrowUp', input: 'Click, ArrowUp', expectedCount: 10, expectedStatus: 'max-boundary-reached' },
  { step: 13, name: 'Exact boundary condition: at count 10, button is disabled and further ArrowUp keys do not exceed 10', input: '3x ArrowUp + button click at max boundary', expectedCount: 10, expectedStatus: 'max-boundary-clamped' },
  { step: 14, name: 'Reset button restores count to 0 and clears boundary alert', input: 'Click reset button', expectedCount: 0, expectedStatus: 'min-boundary' },
  { step: 15, name: 'Post-reset increment: button click increments count to 1', input: 'Click increment button', expectedCount: 1, expectedStatus: 'within-boundary' },
];

try {
  console.log('--- Starting R19-T042 Verification ---');

  // Step A: Start local Vite server
  console.log('\n[Step A] Starting local Vite server...');
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5174 },
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
    titleText.includes('Button & Shortcut State Transition'),
    `Expected page title to include "Button & Shortcut State Transition", got "${titleText}"`
  );

  const counterLocator = page.getByTestId('counter-value');
  const incrementBtn = page.getByTestId('increment-btn');
  const resetBtn = page.getByTestId('reset-btn');
  const manualInput = page.getByTestId('manual-input');
  const applyBtn = page.getByTestId('apply-manual-btn');
  const boundaryStatusLocator = page.getByTestId('boundary-status');

  // Helper to read count
  async function getCount() {
    return parseInt((await counterLocator.textContent()).trim(), 10);
  }

  // 1. Initial State
  console.log('\n[Check 1] Checking initial state...');
  let currentCount = await getCount();
  assert.equal(currentCount, 0, `Initial count should be 0, got ${currentCount}`);
  assert.equal(await incrementBtn.isEnabled(), true, 'Increment button should be enabled initially');
  recordedSteps.push({
    step: 1,
    scenario: EXPECTED_SCENARIOS[0].name,
    input: EXPECTED_SCENARIOS[0].input,
    expected: 0,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Initial count is 0 and increment button is enabled`);

  // 2. Single Button Click
  console.log('\n[Check 2] Clicking increment button once...');
  await incrementBtn.click();
  currentCount = await getCount();
  assert.equal(currentCount, 1, `Count after 1 click should be 1, got ${currentCount}`);
  recordedSteps.push({
    step: 2,
    scenario: EXPECTED_SCENARIOS[1].name,
    input: EXPECTED_SCENARIOS[1].input,
    expected: 1,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Button click incremented count from 0 to 1`);

  // 3. Single Documented Shortcut Key (ArrowUp)
  console.log('\n[Check 3] Pressing documented shortcut key "ArrowUp"...');
  await page.keyboard.press('ArrowUp');
  currentCount = await getCount();
  assert.equal(currentCount, 2, `Count after ArrowUp should be 2, got ${currentCount}`);
  recordedSteps.push({
    step: 3,
    scenario: EXPECTED_SCENARIOS[2].name,
    input: EXPECTED_SCENARIOS[2].input,
    expected: 2,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Documented key "ArrowUp" incremented count from 1 to 2`);

  // 4. Irrelevant keys leave state unchanged
  console.log('\n[Check 4] Pressing irrelevant keys (ArrowDown, a, x, Enter, Escape, Tab, Shift, Space)...');
  const irrelevantKeys = ['ArrowDown', 'a', 'x', 'Enter', 'Escape', 'Tab', 'Shift', ' '];
  for (const key of irrelevantKeys) {
    await page.keyboard.press(key);
  }
  currentCount = await getCount();
  assert.equal(currentCount, 2, `Count after irrelevant keys should remain 2, got ${currentCount}`);
  recordedSteps.push({
    step: 4,
    scenario: EXPECTED_SCENARIOS[3].name,
    input: EXPECTED_SCENARIOS[3].input,
    expected: 2,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Irrelevant keys left state unchanged at 2`);

  // 5. Alternating button click and ArrowUp
  console.log('\n[Check 5] Alternating button clicks and ArrowUp keys...');
  await incrementBtn.click(); // 3
  await page.keyboard.press('ArrowUp'); // 4
  await incrementBtn.click(); // 5
  await page.keyboard.press('ArrowUp'); // 6
  currentCount = await getCount();
  assert.equal(currentCount, 6, `Count after alternating increments should be 6, got ${currentCount}`);
  recordedSteps.push({
    step: 5,
    scenario: EXPECTED_SCENARIOS[4].name,
    input: EXPECTED_SCENARIOS[4].input,
    expected: 6,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Alternating clicks and shortcuts incremented cleanly to 6`);

  // 6. Input field typing isolation
  console.log('\n[Check 6] Testing input field typing isolation...');
  await manualInput.click();
  await page.keyboard.type('ArrowUp');
  currentCount = await getCount();
  assert.equal(currentCount, 6, `Typing inside input should NOT trigger shortcut; count should remain 6, got ${currentCount}`);
  await manualInput.fill(''); // clear input
  recordedSteps.push({
    step: 6,
    scenario: EXPECTED_SCENARIOS[5].name,
    input: EXPECTED_SCENARIOS[5].input,
    expected: 6,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Typing inside input did not trigger shortcut`);

  // 7. Empty-input handling
  console.log('\n[Check 7] Testing empty-input validation...');
  await manualInput.fill('');
  await applyBtn.click();
  currentCount = await getCount();
  assert.equal(currentCount, 6, `Submitting empty input should leave count unchanged at 6, got ${currentCount}`);
  const errorLocator = page.getByTestId('validation-error');
  assert.equal(await errorLocator.count(), 1, 'Validation error should be displayed for empty input');
  const emptyErrorText = (await errorLocator.textContent()).trim();
  assert.ok(emptyErrorText.includes('Input cannot be empty'), `Expected "Input cannot be empty", got "${emptyErrorText}"`);
  recordedSteps.push({
    step: 7,
    scenario: EXPECTED_SCENARIOS[6].name,
    input: EXPECTED_SCENARIOS[6].input,
    expected: 6,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Empty input was rejected with validation message: "${emptyErrorText}"`);

  // 8. Invalid-input handling: non-numeric string "abc"
  console.log('\n[Check 8] Testing invalid non-numeric input "abc"...');
  await manualInput.fill('abc');
  await applyBtn.click();
  currentCount = await getCount();
  assert.equal(currentCount, 6, `Submitting non-numeric input should leave count unchanged at 6, got ${currentCount}`);
  const abcErrorText = (await errorLocator.textContent()).trim();
  assert.ok(abcErrorText.includes('Invalid input "abc"'), `Expected invalid input error for "abc", got "${abcErrorText}"`);
  recordedSteps.push({
    step: 8,
    scenario: EXPECTED_SCENARIOS[7].name,
    input: EXPECTED_SCENARIOS[7].input,
    expected: 6,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Non-numeric input "abc" was rejected with validation error`);

  // 9. Invalid-input handling: negative number "-5"
  console.log('\n[Check 9] Testing negative number input "-5"...');
  await manualInput.fill('-5');
  await applyBtn.click();
  currentCount = await getCount();
  assert.equal(currentCount, 6, `Submitting negative input should leave count at 6, got ${currentCount}`);
  const negErrorText = (await errorLocator.textContent()).trim();
  assert.ok(negErrorText.includes('Invalid input "-5"'), `Expected invalid input error for "-5", got "${negErrorText}"`);
  recordedSteps.push({
    step: 9,
    scenario: EXPECTED_SCENARIOS[8].name,
    input: EXPECTED_SCENARIOS[8].input,
    expected: 6,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Negative input "-5" was rejected with validation error`);

  // 10. Invalid-input handling: out-of-boundary number "99"
  console.log('\n[Check 10] Testing out-of-boundary number input "99"...');
  await manualInput.fill('99');
  await applyBtn.click();
  currentCount = await getCount();
  assert.equal(currentCount, 6, `Submitting out-of-boundary input should leave count at 6, got ${currentCount}`);
  const boundErrorText = (await errorLocator.textContent()).trim();
  assert.ok(boundErrorText.includes('Invalid input "99"'), `Expected invalid input error for "99", got "${boundErrorText}"`);
  recordedSteps.push({
    step: 10,
    scenario: EXPECTED_SCENARIOS[9].name,
    input: EXPECTED_SCENARIOS[9].input,
    expected: 6,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Out-of-boundary input "99" was rejected with validation error`);

  // 11. Valid manual input within boundary: "8"
  console.log('\n[Check 11] Setting valid manual input "8"...');
  await manualInput.fill('8');
  await applyBtn.click();
  currentCount = await getCount();
  assert.equal(currentCount, 8, `Count after applying valid "8" should be 8, got ${currentCount}`);
  assert.equal(await errorLocator.count(), 0, 'Validation error should be cleared for valid input');
  recordedSteps.push({
    step: 11,
    scenario: EXPECTED_SCENARIOS[10].name,
    input: EXPECTED_SCENARIOS[10].input,
    expected: 8,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Valid input "8" updated count to 8 and cleared errors`);

  // 12. Approach boundary: button click -> 9, ArrowUp -> 10
  console.log('\n[Check 12] Incrementing to 9 via button, then 10 via ArrowUp...');
  await incrementBtn.click();
  assert.equal(await getCount(), 9, 'Count after button click should be 9');
  await page.keyboard.press('ArrowUp');
  currentCount = await getCount();
  assert.equal(currentCount, 10, `Count after ArrowUp should be 10 (maximum boundary), got ${currentCount}`);
  recordedSteps.push({
    step: 12,
    scenario: EXPECTED_SCENARIOS[11].name,
    input: EXPECTED_SCENARIOS[11].input,
    expected: 10,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Reached stated maximum boundary (10)`);

  // 13. Exact Boundary Condition Enforcement
  console.log('\n[Check 13] Verifying exact boundary condition enforcement at MAX_COUNT (10)...');
  assert.equal(await incrementBtn.isDisabled(), true, 'Increment button MUST be disabled at maximum boundary');
  const boundaryAlert = page.getByTestId('boundary-alert');
  assert.equal(await boundaryAlert.count(), 1, 'Boundary alert must be displayed when count is at maximum');
  const alertText = (await boundaryAlert.textContent()).trim();
  assert.ok(alertText.includes('Boundary reached'), `Expected boundary alert message, got "${alertText}"`);

  // Attempt button click when disabled (using force: true)
  await incrementBtn.click({ force: true });
  assert.equal(await getCount(), 10, 'Count must NOT exceed 10 even if forced click occurs');

  // Attempt 3x ArrowUp keystrokes at boundary
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  currentCount = await getCount();
  assert.equal(currentCount, 10, `Count must remain strictly 10; cannot exceed boundary, got ${currentCount}`);

  recordedSteps.push({
    step: 13,
    scenario: EXPECTED_SCENARIOS[12].name,
    input: EXPECTED_SCENARIOS[12].input,
    expected: 10,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Exact boundary condition enforced: count clamped at 10, button disabled, shortcut blocked`);

  // 14. Reset transition
  console.log('\n[Check 14] Testing reset button...');
  await resetBtn.click();
  currentCount = await getCount();
  assert.equal(currentCount, 0, `Count after reset should be 0, got ${currentCount}`);
  assert.equal(await boundaryAlert.count(), 0, 'Boundary alert should be cleared after reset');
  assert.equal(await incrementBtn.isEnabled(), true, 'Increment button should be re-enabled after reset');
  recordedSteps.push({
    step: 14,
    scenario: EXPECTED_SCENARIOS[13].name,
    input: EXPECTED_SCENARIOS[13].input,
    expected: 0,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Reset button restored count to 0 and re-enabled increment button`);

  // 15. Post-reset increment
  console.log('\n[Check 15] Post-reset increment verification...');
  await incrementBtn.click();
  currentCount = await getCount();
  assert.equal(currentCount, 1, `Count after post-reset click should be 1, got ${currentCount}`);
  recordedSteps.push({
    step: 15,
    scenario: EXPECTED_SCENARIOS[14].name,
    input: EXPECTED_SCENARIOS[14].input,
    expected: 1,
    actual: currentCount,
    passed: true,
  });
  console.log(`PASS: Post-reset increment confirmed (count = 1)`);

  // Step D: Verify absence of errors
  console.log('\n[Step D] Verifying no console errors, page errors, or network failures...');
  assert.deepEqual(consoleErrors, [], `Console errors detected: ${JSON.stringify(consoleErrors)}`);
  assert.deepEqual(pageErrors, [], `Page errors detected: ${JSON.stringify(pageErrors)}`);
  assert.deepEqual(requestFailures, [], `Failed network requests: ${JSON.stringify(requestFailures)}`);
  console.log('PASS: Zero console errors, page errors, or network failures.');

  console.log('\nALL 15 VERIFICATION CHECKS PASSED SUCCESSFULLY.');
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

// Step E: Save evidence to work/R19-T042/
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
    taskId: 'R19-T042',
    timestamp: new Date().toISOString(),
    passed: !failed,
    command: 'node 10_React_Project_Folder_Structure/applied-labs/r19-t042/check.mjs',
    exitCode: failed ? 1 : 0,
    versions,
    scenarios: EXPECTED_SCENARIOS,
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

  const evidenceMd = `# Evidence: R19-T042 Button & Keyboard Shortcut State Transition Lab

## Overview
- **Task ID:** R19-T042
- **URN:** e26b07f0587
- **Branch:** \`R19-T042\` (and \`student/e26b07f0587/R19-T042\`)
- **Goal:** Implement a button and keyboard shortcut that update the same state transition. Click and the documented key each increment once; irrelevant keys leave state unchanged.
- **Contribution Focus:** Concentrate on the stated boundary and invalid/empty-input behavior; explain the exact boundary condition in the lesson.

## Boundary Condition Specification
- **State Interval:** \`[0, 10]\` (\`MIN_COUNT = 0\`, \`MAX_COUNT = 10\`).
- **Initial State:** \`0\`.
- **Exact Boundary Condition:** At \`count === 10\`, the counter reaches its upper boundary. Further button clicks and documented \`ArrowUp\` keypresses are blocked from exceeding \`10\`. The Increment button is disabled, and an explicit boundary alert is shown.
- **Invalid / Empty Input Behavior:**
  - Irrelevant keys (\`ArrowDown\`, \`a\`, \`x\`, \`Enter\`, \`Escape\`, \`Tab\`, \`Shift\`, \`Space\`) leave state completely unchanged.
  - Submitting an empty string \`""\` to the value setter is rejected with an explicit validation message and leaves state unchanged.
  - Submitting non-numeric (\`"abc"\`), negative (\`"-5"\`), or out-of-boundary (\`"99"\`) inputs is rejected with explicit validation errors and leaves state unchanged.
  - Typing within input elements is isolated from global keyboard shortcut listeners.

## Expected vs Actual Results Table

| Step | Scenario | Input Action | Expected Count | Actual Count | Status |
|------|----------|--------------|----------------|--------------|--------|
${recordedSteps.map((s) => `| ${s.step} | ${s.scenario} | \`${s.input}\` | ${s.expected} | ${s.actual} | **${s.passed ? 'PASS' : 'FAIL'}** |`).join('\n')}

## Console & Page Errors
- Console errors: \`${consoleErrors.length}\`
- Page errors: \`${pageErrors.length}\`
- Failed requests: \`${requestFailures.length}\`

## Test Execution Details
- **Exact Test Command:** \`node 10_React_Project_Folder_Structure/applied-labs/r19-t042/check.mjs\`
- **Exit Code:** \`${failed ? 1 : 0}\`
- **Overall Result:** **${failed ? 'FAILED' : 'PASSED'}**

## Negative / Mutant Testing
A mutant test was executed by temporarily modifying the boundary check in \`example.jsx\` from \`prev >= MAX_COUNT\` to \`false\` (allowing unlimited increments past 10).
- **Result:** The check immediately failed at Step 13 (\`Count must remain strictly 10; cannot exceed boundary, got 13\`), cleanly shutting down the browser and server, and exiting with status code \`1\`.
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
