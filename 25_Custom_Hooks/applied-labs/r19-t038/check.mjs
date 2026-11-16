// Playwright check for the R19-T038 applied lab.
// Run from the repository root: node 25_Custom_Hooks/applied-labs/r19-t038/check.mjs
// It builds the lab, serves it on http://localhost:4173, drives it in
// Chromium, then stops the server and closes the browser. Any failed
// assertion, or any console/page error, exits non-zero.
//
// The check drives one failure-and-recovery arc per panel in a single
// page session — no reload, no restart — and asserts the other panel
// never moves.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

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

// Returns the text of an element, or null when it is not on the page.
async function textOrNull(page, testId) {
  const el = page.getByTestId(testId);
  const count = await el.count();
  if (count === 0) return null;
  return el.textContent();
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

  async function states() {
    const a = await page.getByTestId('panel-a-state').textContent();
    const b = await page.getByTestId('panel-b-state').textContent();
    return { a, b };
  }

  // Initial: A off, B on, no errors.
  let s = await states();
  check(
    s.a === 'off' && s.b === 'on' &&
      (await textOrNull(page, 'panel-a-error')) === null &&
      (await textOrNull(page, 'panel-b-error')) === null,
    'initial: A=off, B=on, no errors'
  );

  // Toggle A leaves B unchanged.
  await page.getByTestId('panel-a-toggle').click();
  s = await states();
  check(s.a === 'on' && s.b === 'on', 'toggle A: A=on, B still on');

  // Invalid word on A: the error shows and A stays on.
  await page.getByTestId('panel-a-input').fill('maybe');
  await page.getByTestId('panel-a-apply').click();
  check(
    (await textOrNull(page, 'panel-a-error')) === 'Enter on or off.',
    'invalid word shows the error'
  );
  s = await states();
  check(s.a === 'on' && s.b === 'on', 'invalid word leaves A on, B on');

  // The next valid word recovers: error gone, A off, B still on.
  await page.getByTestId('panel-a-input').fill('off');
  await page.getByTestId('panel-a-apply').click();
  check(
    (await textOrNull(page, 'panel-a-error')) === null,
    'valid word clears the error'
  );
  s = await states();
  check(s.a === 'off' && s.b === 'on', 'recovery: A=off, B still on');

  // Toggle B leaves A unchanged.
  await page.getByTestId('panel-b-toggle').click();
  s = await states();
  check(s.a === 'off' && s.b === 'off', 'toggle B: B=off, A still off');

  // Reset B restores its initial value.
  await page.getByTestId('panel-b-reset').click();
  s = await states();
  check(s.a === 'off' && s.b === 'on', 'reset B: B=on, A still off');

  // Empty word on B: the error shows and B stays on.
  await page.getByTestId('panel-b-input').fill('');
  await page.getByTestId('panel-b-apply').click();
  check(
    (await textOrNull(page, 'panel-b-error')) === 'Enter on or off.',
    'empty word shows the error'
  );
  s = await states();
  check(s.a === 'off' && s.b === 'on', 'empty word leaves B on, A off');

  // The next valid word recovers B too — still no restart.
  await page.getByTestId('panel-b-input').fill('OFF');
  await page.getByTestId('panel-b-apply').click();
  check(
    (await textOrNull(page, 'panel-b-error')) === null,
    'valid word clears the error on B'
  );
  s = await states();
  check(s.a === 'off' && s.b === 'off', 'recovery on B: B=off, A still off');

  // No console or page errors during the run.
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
