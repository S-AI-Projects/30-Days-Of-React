// Playwright check for the R19-T039 applied lab.
// Run from the repository root: node 15_Third_Party_Packages/applied-labs/r19-t039/check.mjs
// It builds the lab, serves it on http://localhost:4173, drives it in
// Chromium, then stops the server and closes the browser. Any failed
// assertion, or any console/page error, exits non-zero.
//
// The input-scale experiment: the wrapper is rendered at three bounded
// input sizes (1, 10, 100 items from fixture.mjs). The check asserts
// correctness at each size and reports the adapter-call counts —
// operation counts, not timings. No speed threshold is imposed.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { SIZES, makeItems } from './fixture.mjs';

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

  // Known input renders correctly through the wrapper.
  const known = page.getByTestId('badge-known').locator('span');
  check((await known.textContent()) === 'Ada Lovelace', 'known input renders its label');
  check((await known.getAttribute('data-tone')) === 'success', 'known input keeps the success tone');

  // An empty value has a fallback.
  const empty = page.getByTestId('badge-empty').locator('span');
  check((await empty.textContent()) === 'No label', 'empty label falls back to "No label"');
  check((await empty.getAttribute('data-tone')) === 'error', 'empty label keeps the error tone');

  // The wrapper is tested with the stub: the adapter's exact output.
  const stubKnown = await page
    .getByTestId('stub-known')
    .locator('pre')
    .textContent();
  check(
    stubKnown === '{"text":"Ada","tone":"success"}',
    'stub receives the adapted props for a known input'
  );
  const stubEmpty = await page
    .getByTestId('stub-empty')
    .locator('pre')
    .textContent();
  check(
    stubEmpty === '{"text":"No label","tone":"error"}',
    'stub receives the adapted props for an empty input'
  );

  // Input-scale experiment: three bounded sizes, correctness asserted
  // and adapter-call counts reported (counts, not timings).
  for (const size of SIZES) {
    const list = page.getByTestId(`list-${size}`);
    const rendered = await list.locator('span').count();
    const calls = Number(await page.getByTestId(`list-${size}-calls`).textContent());
    const count = Number(await list.getByTestId(`list-${size}-count`).textContent());
    console.log(`size ${size}: ${rendered} items rendered, ${calls} adapter calls`);
    check(rendered === size, `size ${size}: exactly ${size} items rendered`);
    check(calls === size, `size ${size}: exactly ${size} adapter calls`);
    check(count === size, `size ${size}: list reports ${size} items`);
    if (size === 100) {
      const expected = makeItems(100);
      const first = await list.locator('span').first().textContent();
      const last = await list.locator('span').last().textContent();
      check(first === expected[0].label, 'size 100: first item is Item 1');
      check(last === expected[99].label, 'size 100: last item is Item 100');
    }
  }

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
