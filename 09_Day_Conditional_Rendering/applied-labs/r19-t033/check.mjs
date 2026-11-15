// Playwright check for the R19-T033 applied lab.
// Run from the repository root: node 09_Day_Conditional_Rendering/applied-labs/r19-t033/check.mjs
// It builds the lab, serves it on http://localhost:4173, drives it in
// Chromium, then stops the server and closes the browser. Any failed
// assertion, or any console/page error, exits non-zero.
//
// The check compares the rendered page against the independent
// expected-result table in expected.mjs — the reference for this lab.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { EXPECTED } from './expected.mjs';

const labDir = path.dirname(fileURLToPath(import.meta.url));
const viteBin = path.join(labDir, 'node_modules', 'vite', 'bin', 'vite.js');
const baseUrl = 'http://localhost:4173';

if (!existsSync(viteBin)) {
  console.log('FAIL - dependencies are not installed. Run this first in the lab folder:');
  console.log('  npm ci');
  console.log('  npx playwright install chromium');
  process.exit(1);
}

function runVite(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [viteBin, ...args], { cwd: labDir, stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (d) => { output += d; });
    child.stderr.on('data', (d) => { output += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`vite ${args.join(' ')} exited with ${code}\n${output}`));
    });
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not answer at ${url} within ${timeoutMs}ms`);
}

// Launches the Playwright-bundled Chromium. If its download never
// finished (the Playwright CDN stalls on some connections), falls back
// to the Google Chrome already installed on this Mac.
async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (err) {
    console.log('bundled Chromium launch failed, falling back to the installed Google Chrome...');
    return await chromium.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });
  }
}

const failures = [];
function check(condition, label) {
  if (condition) {
    console.log(`ok - ${label}`);
  } else {
    failures.push(label);
    console.log(`FAIL - ${label}`);
  }
}

let server = null;
let browser = null;
try {
  console.log('building the lab...');
  await runVite(['build']);
  console.log('starting the preview server...');
  server = spawn(process.execPath, [viteBin, 'preview'], { cwd: labDir, stdio: 'pipe' });
  await waitForServer(baseUrl);

  browser = await launchBrowser();
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // 1. Each supplied state renders exactly the message or list the
  //    independent reference table expects — nothing more, nothing less.
  check((await page.getByTestId('view-loading').textContent()) === EXPECTED.loading, 'loading matches the reference');
  check((await page.getByTestId('view-empty').textContent()) === EXPECTED.empty, 'empty matches the reference');
  check((await page.getByTestId('view-error').textContent()) === EXPECTED.error, 'error matches the reference');
  check((await page.getByTestId('view-unknown').textContent()) === EXPECTED.unknown, 'unknown matches the reference');

  // 2. Success renders the reference result list: exactly three items,
  //    in the reference order.
  const itemTexts = await page.getByTestId('view-success').locator('li').allTextContents();
  check(itemTexts.length === EXPECTED.success.length, 'success renders three results');
  check(JSON.stringify(itemTexts) === JSON.stringify(EXPECTED.success), 'success items match the reference');

  // 3. Exactly one view per state: five views, and only the success view
  //    renders a list — no state shows two views at once.
  check((await page.locator('[data-testid^="view-"]').count()) === 5, 'five views are rendered');
  check((await page.locator('ul').count()) === 1, 'only the success view renders a list');

  // 4. No view is ever blank.
  const viewTexts = await page.locator('[data-testid^="view-"]').allTextContents();
  check(viewTexts.every((t) => t.trim().length > 0), 'no view is blank');

  // 5. No console or page errors during the whole run.
  check(pageErrors.length === 0, `no page errors (got ${pageErrors.length})`);
  check(consoleErrors.length === 0, `no console errors (got ${consoleErrors.length})`);
} catch (err) {
  failures.push(`check crashed: ${err.message}`);
  console.log(`FAIL - check crashed: ${err.message}`);
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}

if (failures.length > 0) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
