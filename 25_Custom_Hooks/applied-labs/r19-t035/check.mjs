// Playwright check for the R19-T035 applied lab.
// Run from the repository root: node 25_Custom_Hooks/applied-labs/r19-t035/check.mjs
// It builds the lab, serves it on http://localhost:4173, drives it in
// Chromium, then stops the server and closes the browser. Any failed
// assertion, or any console/page error, exits non-zero.
//
// The check runs the same operation sequence twice in two isolated
// runs (two fresh browser contexts) and compares both runs against the
// deterministic local fixture in fixture.mjs — and against each other.
// The hook uses no time, storage, events or network, so the fixture is
// the whole repeatable input.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { EXPECTED } from './fixture.mjs';

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

// Runs the full operation sequence on one page and records the panel
// states after every step.
async function runSequence(page) {
  const snapshots = [];
  async function snap(label) {
    const a = await page.getByTestId('panel-a-state').textContent();
    const b = await page.getByTestId('panel-b-state').textContent();
    snapshots.push({ label, a, b });
  }
  await snap('initial');
  await page.getByTestId('panel-a-toggle').click();
  await snap('toggle A');
  await page.getByTestId('panel-a-toggle').click();
  await snap('toggle A again');
  await page.getByTestId('panel-a-set-on').click();
  await snap('set A on');
  await page.getByTestId('panel-a-reset').click();
  await snap('reset A');
  await page.getByTestId('panel-b-toggle').click();
  await snap('toggle B');
  await page.getByTestId('panel-b-set-off').click();
  await snap('set B off');
  await page.getByTestId('panel-b-reset').click();
  await snap('reset B');
  return snapshots;
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

  // Run 1: first isolated context.
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page1.on('pageerror', (err) => pageErrors.push(String(err)));
  page1.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page1.goto(baseUrl, { waitUntil: 'networkidle' });
  const run1 = await runSequence(page1);
  await context1.close();

  // Run 1 matches the deterministic fixture, step by step.
  for (let i = 0; i < EXPECTED.length; i++) {
    const same =
      run1[i].a === EXPECTED[i].a && run1[i].b === EXPECTED[i].b;
    check(
      same,
      `run 1 after "${EXPECTED[i].label}": A=${EXPECTED[i].a}, B=${EXPECTED[i].b}`
    );
  }

  // Run 2: a second isolated context, same sequence.
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  page2.on('pageerror', (err) => pageErrors.push(String(err)));
  page2.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page2.goto(baseUrl, { waitUntil: 'networkidle' });
  const run2 = await runSequence(page2);
  await context2.close();

  // The two isolated runs agree exactly.
  check(
    JSON.stringify(run2) === JSON.stringify(run1),
    'two isolated runs agree'
  );

  // No console or page errors during either run.
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
