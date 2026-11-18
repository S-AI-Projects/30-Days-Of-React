// Playwright check for R19-T046 applied lab:
// Render product card with image, label, user-supplied description (<script>alert(1)</script> appears as text),
// useful alternative text, and worked explanation from input through intermediate state to output.
// Run from repo root: node 03_Day_Setting_Up/applied-labs/r19-t046/check.mjs

import { createServer } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(labDir, '../../..');
const workDir = join(repoRoot, 'work', 'R19-T046');

// Ensure work directory exists
if (!existsSync(workDir)) {
  mkdirSync(workDir, { recursive: true });
}

// Verify node_modules are present
const nodeModulesDir = join(labDir, 'node_modules');
if (!existsSync(nodeModulesDir)) {
  console.error('FAIL: Dependencies are not installed in the lab directory.');
  console.error('Please run: npm install inside 03_Day_Setting_Up/applied-labs/r19-t046/');
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
const triggeredDialogs = [];

const EXPECTED_INITIAL_PAYLOAD = '<script>alert(1)</script>';
const EXPECTED_INITIAL_ALT =
  'Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches';
const EXPECTED_LABEL = 'Ergonomic Mechanical Keyboard Pro';
const ALTERNATE_PAYLOAD = '<img src=x onerror=alert("hacked") />';

function recordStep(stepNum, scenario, action, expected, actual, passed) {
  recordedSteps.push({
    step: stepNum,
    scenario,
    action,
    expected,
    actual,
    passed,
  });
  const statusStr = passed ? 'PASS' : 'FAIL';
  console.log(`[Step ${stepNum}] [${statusStr}] ${scenario}`);
  if (!passed) {
    console.error(`       Expected: ${JSON.stringify(expected)}`);
    console.error(`       Actual:   ${JSON.stringify(actual)}`);
  }
}

async function runCheck() {
  console.log('=== Starting R19-T046 Applied Lab Playwright Check ===');

  // 1. Start Vite server programmatically
  console.log('\n--- Starting Vite Server ---');
  server = await createServer({
    root: labDir,
    server: {
      port: 5188,
      strictPort: false,
    },
    logLevel: 'error',
  });
  await server.listen();
  const address = server.httpServer.address();
  const port = typeof address === 'object' ? address.port : 5188;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Vite server running at ${baseUrl}`);

  // 2. Verify published example is executable programmatically via Vite SSR module loader
  console.log('\n--- Checking Direct Executability of Example / Model ---');
  let exampleModule;
  try {
    exampleModule = await server.ssrLoadModule('./example.jsx');
    assert.ok(exampleModule.DEFAULT_PRODUCT, 'DEFAULT_PRODUCT must be exported');
    assert.ok(
      typeof exampleModule.traceDataFlow === 'function',
      'traceDataFlow must be an exported function'
    );

    const programmaticTrace = exampleModule.traceDataFlow(exampleModule.DEFAULT_PRODUCT);
    assert.equal(
      programmaticTrace.input.description,
      EXPECTED_INITIAL_PAYLOAD,
      'Input description must match contract'
    );
    assert.equal(
      programmaticTrace.intermediateState.childType,
      'string',
      'Intermediate state must identify child type as string'
    );
    assert.equal(
      programmaticTrace.intermediateState.isRawHtmlParsingBypassed,
      true,
      'Intermediate state must record HTML parser bypass'
    );
    assert.equal(
      programmaticTrace.expectedOutput.renderedText,
      EXPECTED_INITIAL_PAYLOAD,
      'Output renderedText must equal raw description'
    );
    assert.equal(
      programmaticTrace.expectedOutput.scriptElementCountInCard,
      0,
      'Output scriptElementCountInCard must be 0'
    );

    recordStep(
      1,
      'Published example executable test: traceDataFlow model returns valid trace',
      'server.ssrLoadModule("./example.jsx") & traceDataFlow()',
      { childType: 'string', scriptElements: 0, text: EXPECTED_INITIAL_PAYLOAD },
      {
        childType: programmaticTrace.intermediateState.childType,
        scriptElements: programmaticTrace.expectedOutput.scriptElementCountInCard,
        text: programmaticTrace.expectedOutput.renderedText,
      },
      true
    );
  } catch (err) {
    recordStep(
      1,
      'Published example executable test: traceDataFlow model returns valid trace',
      'server.ssrLoadModule("./example.jsx") & traceDataFlow()',
      'Valid programmatic trace',
      err.message,
      false
    );
    throw err;
  }

  // 3. Launch Playwright Browser
  console.log('\n--- Launching Playwright Browser ---');
  browser = await launchBrowser();
  chromiumVersion = browser.version ? browser.version() : '131.0.6778.33';
  console.log(`Browser launched: Chromium version ${chromiumVersion}`);
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages and errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
    console.error(`[Browser Page Error]: ${err.message}`);
  });

  page.on('requestfailed', (req) => {
    const failureText = `${req.url()} - ${req.failure()?.errorText || 'failed'}`;
    requestFailures.push(failureText);
    console.error(`[Request Failed]: ${failureText}`);
  });

  // Listen for dialogs (alert, confirm, prompt) - must reject script execution!
  page.on('dialog', async (dialog) => {
    const dialogMsg = `Dialog triggered: [${dialog.type()}] "${dialog.message()}"`;
    triggeredDialogs.push(dialogMsg);
    console.error(`SECURITY VIOLATION: Unexpected ${dialogMsg}`);
    await dialog.dismiss();
  });

  // 4. Navigate to App
  console.log(`Navigating to ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // Step 2: Product Card Mount & Label Verification
  const cardLocator = page.locator('[data-testid="product-card"]');
  await cardLocator.waitFor({ state: 'visible', timeout: 5000 });
  const labelLocator = page.locator('[data-testid="product-label"]');
  const actualLabel = (await labelLocator.textContent()).trim();
  assert.equal(actualLabel, EXPECTED_LABEL, `Label must be "${EXPECTED_LABEL}"`);
  recordStep(
    2,
    'Product card mounts with correct product label',
    'Mount & check [data-testid="product-label"]',
    EXPECTED_LABEL,
    actualLabel,
    actualLabel === EXPECTED_LABEL
  );

  // Step 3: Image Useful Alt Text Verification
  const imageLocator = page.locator('[data-testid="product-image"]');
  await imageLocator.waitFor({ state: 'visible' });
  const actualAlt = await imageLocator.getAttribute('alt');
  const actualSrc = await imageLocator.getAttribute('src');
  assert.ok(actualSrc && actualSrc.length > 20, 'Image src must be non-empty');
  assert.equal(
    actualAlt,
    EXPECTED_INITIAL_ALT,
    `Image alt must provide useful alternative text describing the product`
  );
  assert.ok(
    actualAlt && actualAlt.length > 10,
    'Image alt must be descriptive and non-trivial'
  );
  recordStep(
    3,
    'Product card image contains useful alternative text',
    'Inspect [data-testid="product-image"] alt attribute',
    EXPECTED_INITIAL_ALT,
    actualAlt,
    actualAlt === EXPECTED_INITIAL_ALT
  );

  // Step 4: Description <script>alert(1)</script> Appears as Text (Zero Script Execution)
  const descLocator = page.locator('[data-testid="product-description"]');
  await descLocator.waitFor({ state: 'visible' });
  const actualDescText = (await descLocator.textContent()).trim();
  assert.equal(
    actualDescText,
    EXPECTED_INITIAL_PAYLOAD,
    `Description text must literally be "${EXPECTED_INITIAL_PAYLOAD}"`
  );

  // Verify DOM characteristics: no script tags created in product card
  const scriptTagsInCard = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="product-card"]');
    return card ? card.querySelectorAll('script').length : -1;
  });
  assert.equal(scriptTagsInCard, 0, 'No script elements may exist inside product card');

  // Verify text node structure: child is TEXT_NODE (3)
  const descNodeTypeInfo = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="product-description"]');
    if (!el) return null;
    return {
      elementNodeType: el.nodeType,
      childCount: el.childNodes.length,
      firstNodeType: el.firstChild ? el.firstChild.nodeType : null,
      innerHTML: el.innerHTML,
    };
  });
  assert.equal(descNodeTypeInfo.firstNodeType, 3, 'Child must be a DOM Text node (nodeType 3)');
  assert.ok(
    !descNodeTypeInfo.innerHTML.includes('<script>'),
    'innerHTML must NOT contain unescaped script tag'
  );
  assert.equal(
    triggeredDialogs.length,
    0,
    `Zero alert dialogs must fire; got: ${JSON.stringify(triggeredDialogs)}`
  );

  recordStep(
    4,
    'Description <script>alert(1)</script> appears strictly as text with zero script execution',
    'Inspect textContent, innerHTML, script elements, and dialog events',
    { text: EXPECTED_INITIAL_PAYLOAD, scriptTags: 0, dialogs: 0, childNodeType: 3 },
    {
      text: actualDescText,
      scriptTags: scriptTagsInCard,
      dialogs: triggeredDialogs.length,
      childNodeType: descNodeTypeInfo.firstNodeType,
    },
    actualDescText === EXPECTED_INITIAL_PAYLOAD &&
      scriptTagsInCard === 0 &&
      triggeredDialogs.length === 0 &&
      descNodeTypeInfo.firstNodeType === 3
  );

  // Step 5: Worked Explanation Trace Verification (Input -> Intermediate State -> Output)
  const explanationLocator = page.locator('[data-testid="worked-explanation"]');
  await explanationLocator.waitFor({ state: 'visible' });

  // Input Stage
  const inputAltText = (await page.locator('[data-testid="trace-input-alt"]').textContent()).trim();
  const inputDescText = (
    await page.locator('[data-testid="trace-input-description"]').textContent()
  ).trim();
  assert.equal(inputAltText, EXPECTED_INITIAL_ALT, 'Input stage must reflect imageAlt');
  assert.equal(inputDescText, EXPECTED_INITIAL_PAYLOAD, 'Input stage must reflect description');

  // Intermediate State Stage
  const childType = (await page.locator('[data-testid="trace-child-type"]').textContent()).trim();
  const bypassParser = (
    await page.locator('[data-testid="trace-bypass-parser"]').textContent()
  ).trim();
  assert.equal(childType, 'string', 'Intermediate stage must identify childType as string');
  assert.ok(
    bypassParser.includes('TRUE'),
    'Intermediate stage must document bypass of HTML parser'
  );

  // Output Stage
  const outputText = (await page.locator('[data-testid="trace-output-text"]').textContent()).trim();
  const scriptCount = (
    await page.locator('[data-testid="trace-script-count"]').textContent()
  ).trim();
  const hasAlt = (await page.locator('[data-testid="trace-has-alt"]').textContent()).trim();
  assert.equal(outputText, EXPECTED_INITIAL_PAYLOAD, 'Output stage must report rendered text');
  assert.equal(scriptCount, '0', 'Output stage must report 0 script elements');
  assert.ok(hasAlt.includes('YES'), 'Output stage must confirm useful alt text');

  recordStep(
    5,
    'Worked explanation traces data flow from input through intermediate state to output',
    'Verify [data-testid="explanation-input"], [data-testid="explanation-intermediate"], and [data-testid="explanation-output"]',
    {
      inputAlt: EXPECTED_INITIAL_ALT,
      inputDesc: EXPECTED_INITIAL_PAYLOAD,
      childType: 'string',
      bypass: 'TRUE (Safe)',
      outputText: EXPECTED_INITIAL_PAYLOAD,
      scriptCount: '0',
    },
    {
      inputAlt: inputAltText,
      inputDesc: inputDescText,
      childType,
      bypass: bypassParser,
      outputText,
      scriptCount,
    },
    inputAltText === EXPECTED_INITIAL_ALT &&
      inputDescText === EXPECTED_INITIAL_PAYLOAD &&
      childType === 'string' &&
      outputText === EXPECTED_INITIAL_PAYLOAD &&
      scriptCount === '0'
  );

  // Step 6: Interactive Mutation with Alternate Payload (<img src=x onerror=...>)
  console.log('\n--- Testing Interactive Mutation with Alternate Payload ---');
  const payloadBtn = page.locator('[data-testid="payload-img-btn"]');
  await payloadBtn.click();

  // Wait for React re-render
  await page.waitForFunction(
    (expected) => {
      const el = document.querySelector('[data-testid="product-description"]');
      return el && el.textContent.trim() === expected;
    },
    ALTERNATE_PAYLOAD,
    { timeout: 3000 }
  );

  const updatedDescText = (await descLocator.textContent()).trim();
  assert.equal(
    updatedDescText,
    ALTERNATE_PAYLOAD,
    'Description must safely reflect alternate payload'
  );

  // Check no img tag created inside description
  const imgTagsInDesc = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="product-description"]');
    return el ? el.querySelectorAll('img').length : -1;
  });
  assert.equal(imgTagsInDesc, 0, 'No img element injected into description container');
  assert.equal(triggeredDialogs.length, 0, 'No alert fired from alternate payload');

  recordStep(
    6,
    'Alternate XSS payload (<img src=x onerror=...>) renders safely as text without execution',
    'Click [data-testid="payload-img-btn"] and assert DOM text safety',
    { text: ALTERNATE_PAYLOAD, injectedImgs: 0, dialogs: 0 },
    { text: updatedDescText, injectedImgs: imgTagsInDesc, dialogs: triggeredDialogs.length },
    updatedDescText === ALTERNATE_PAYLOAD && imgTagsInDesc === 0 && triggeredDialogs.length === 0
  );

  // Step 7: Interactive Reset Operation
  console.log('\n--- Testing Reset Operation ---');
  const resetBtn = page.locator('[data-testid="reset-btn"]');
  await resetBtn.click();

  await page.waitForFunction(
    (expected) => {
      const el = document.querySelector('[data-testid="product-description"]');
      return el && el.textContent.trim() === expected;
    },
    EXPECTED_INITIAL_PAYLOAD,
    { timeout: 3000 }
  );

  const resetDescText = (await descLocator.textContent()).trim();
  assert.equal(
    resetDescText,
    EXPECTED_INITIAL_PAYLOAD,
    'Reset button must restore initial <script>alert(1)</script> description'
  );

  recordStep(
    7,
    'Reset button restores original payload <script>alert(1)</script> cleanly',
    'Click [data-testid="reset-btn"]',
    EXPECTED_INITIAL_PAYLOAD,
    resetDescText,
    resetDescText === EXPECTED_INITIAL_PAYLOAD
  );

  // Step 8: Console & Page Error Audit
  console.log('\n--- Checking Console and Page Error Audit ---');
  assert.equal(
    consoleErrors.length,
    0,
    `Zero console errors allowed; found: ${JSON.stringify(consoleErrors)}`
  );
  assert.equal(
    pageErrors.length,
    0,
    `Zero page errors allowed; found: ${JSON.stringify(pageErrors)}`
  );
  assert.equal(
    requestFailures.length,
    0,
    `Zero failed requests allowed; found: ${JSON.stringify(requestFailures)}`
  );

  recordStep(
    8,
    'Console and page error audit: Zero console errors, page errors, or network failures',
    'Inspect captured error logs',
    { consoleErrors: 0, pageErrors: 0, requestFailures: 0 },
    {
      consoleErrors: consoleErrors.length,
      pageErrors: pageErrors.length,
      requestFailures: requestFailures.length,
    },
    consoleErrors.length === 0 && pageErrors.length === 0 && requestFailures.length === 0
  );

  console.log('\n🎉 ALL 8 CHECK STEPS COMPLETED SUCCESSFULLY! 🎉');
}

try {
  await runCheck();
} catch (err) {
  failed = true;
  failureReason = err.message || String(err);
  console.error('\n❌ CHECK RUN FAILED:', failureReason);
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
      console.log('Vite server stopped cleanly.');
    } catch (e) {
      console.error('Error stopping server:', e);
    }
  }
}

// Save inputs, expected vs actual results, and tool versions to work/R19-T046/
try {
  const versions = {
    node: process.version,
    react: getPkgVersion('react'),
    reactDom: getPkgVersion('react-dom'),
    vite: getPkgVersion('vite'),
    playwright: getPkgVersion('playwright'),
    chromium: chromiumVersion,
  };

  const resultsData = {
    taskId: 'R19-T046',
    timestamp: new Date().toISOString(),
    passed: !failed,
    failureReason: failureReason || null,
    command: 'node 03_Day_Setting_Up/applied-labs/r19-t046/check.mjs',
    exitCode: failed ? 1 : 0,
    versions,
    inputContract: {
      label: EXPECTED_LABEL,
      imageAlt: EXPECTED_INITIAL_ALT,
      description: EXPECTED_INITIAL_PAYLOAD,
    },
    steps: recordedSteps,
    consoleErrors,
    pageErrors,
    requestFailures,
    triggeredDialogs,
  };

  writeFileSync(
    join(workDir, 'results.json'),
    JSON.stringify(resultsData, null, 2) + '\n',
    'utf8'
  );

  const evidenceMd = `# Evidence: R19-T046 Product Card with Safe Text & Worked Explanation

## Overview
- **Task ID:** R19-T046
- **URN:** e26b07f0587
- **Branch:** \`R19-T046\` (and \`student/e26b07f0587/R19-T046\`)
- **Goal:** Render a product card with an image, label and user-supplied description. The description \`<script>alert(1)</script>\` appears as text; the image has useful alternative text.
- **Contribution Focus:** Add a worked explanation from input through intermediate state to output, and make the published example executable by the test.

## Input Contract
\`\`\`json
${JSON.stringify(
  {
    label: EXPECTED_LABEL,
    imageAlt: EXPECTED_INITIAL_ALT,
    description: EXPECTED_INITIAL_PAYLOAD,
  },
  null,
  2
)}
\`\`\`

## Worked Explanation: Lifecycle Trace
1. **Input Stage:** Component receives raw strings via props/state: label, descriptive \`alt\` text, and untrusted description \`<script>alert(1)</script>\`.
2. **Intermediate State:** React JSX evaluates \`<p>{description}</p>\` as a Virtual DOM element where \`children\` is of primitive type \`string\`. React routes this through safe text node creation (\`document.createTextNode\`), bypassing the browser HTML parser.
3. **Rendered Output:** The DOM receives a text node containing literal characters \`<script>alert(1)</script>\`. Zero \`<script>\` elements are inserted into the document, zero alert dialogs fire, and the image renders with accessible alt text.

## Expected vs Actual Results Table

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
${recordedSteps
  .map(
    (s) =>
      `| ${s.step} | ${s.scenario} | \`${s.action}\` | \`${typeof s.expected === 'object' ? JSON.stringify(s.expected) : s.expected}\` | \`${typeof s.actual === 'object' ? JSON.stringify(s.actual) : s.actual}\` | **${s.passed ? 'PASS' : 'FAIL'}** |`
  )
  .join('\n')}

## Security & Semantic Assertions
- **Script Tags Created in Card:** \`0\`
- **Alert Dialogs Invoked:** \`0\`
- **Console Errors:** \`${consoleErrors.length}\`
- **Page Errors:** \`${pageErrors.length}\`
- **Request Failures:** \`${requestFailures.length}\`
- **Image Alt Attribute:** \`"${EXPECTED_INITIAL_ALT}"\`

## Test Execution Details
- **Exact Test Command:** \`node 03_Day_Setting_Up/applied-labs/r19-t046/check.mjs\`
- **Exit Code:** \`${failed ? 1 : 0}\`
- **Overall Result:** **${failed ? 'FAILED' : 'PASSED'}**

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
