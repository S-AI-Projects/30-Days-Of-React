// Playwright check for the R19-T036 applied lab.
// Run from the repository root: node 20_projects/applied-labs/r19-t036/check.mjs
// It builds the lab, serves it on http://localhost:4173, drives it in
// Chromium, then stops the server and closes the browser. Any failed
// assertion, or any console/page error, exits non-zero.
//
// The sequence exercises the whole contract against the local fixture
// in fixture.mjs: pagination replaces the records, a failed page shows
// an error and retries, and a slow page's late response cannot
// overwrite a newer page (page 1 takes 700 ms, page 2 takes 80 ms, so
// clicking 1 and then 2 immediately must end on page 2's cats).
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

async function catNames(page) {
  return page.getByTestId('cat').allTextContents();
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
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // 1. Initial load: page 1 cats.
  await page.getByText('Milo', { exact: true }).waitFor();
  let cats = await catNames(page);
  check(cats.includes('Milo'), 'page 1 shows Milo');
  check(cats.length === 3, `page 1 shows exactly 3 cats (got ${cats.length})`);

  // 2. Pagination replaces the records.
  await page.getByTestId('page-2').click();
  await page.getByText('Bella', { exact: true }).waitFor();
  cats = await catNames(page);
  check(
    cats.includes('Bella') && !cats.includes('Milo'),
    'page 2 replaces records: Bella shown, Milo gone'
  );
  check(cats.length === 3, `page 2 shows exactly 3 cats (got ${cats.length})`);

  // 3. Page 3 fails on its first attempt.
  await page.getByTestId('page-3').click();
  await page.getByTestId('retry').waitFor();
  cats = await catNames(page);
  check(
    (await page.getByTestId('status').textContent()).includes('Failed to load page 3'),
    'failed page 3 shows the error'
  );
  check(
    (await page.getByTestId('retry').count()) === 1,
    'retry button is shown after failure'
  );
  check(cats.length === 0, `no cats shown while the page has failed (got ${cats.length})`);

  // 4. Retry loads page 3.
  await page.getByTestId('retry').click();
  await page.getByText('Simba', { exact: true }).waitFor();
  cats = await catNames(page);
  check(cats.includes('Simba'), 'retry loads page 3: Simba shown');
  check(
    (await page.getByTestId('retry').count()) === 0,
    'error is gone after retry'
  );

  // 5. Stale response: page 1 is slow (700 ms), page 2 is fast (80 ms).
  // Click 1 and then 2 immediately; the late page 1 response must not
  // overwrite page 2.
  await page.getByTestId('page-1').click();
  await page.getByTestId('page-2').click();
  await page.waitForTimeout(1200);
  cats = await catNames(page);
  check(
    cats.includes('Bella') && !cats.includes('Milo') && !cats.includes('Simba'),
    'stale response ignored: page 2 cats shown, page 1 and 3 cats absent'
  );
  check(
    (await page.getByTestId('status').textContent()).includes('Page 2 of 3'),
    'status reads Page 2 of 3 after the rapid switch'
  );

  // No console or page errors during the run.
  check(pageErrors.length === 0, `no page errors (got ${pageErrors.length})`);
  check(consoleErrors.length === 0, `no console errors (got ${consoleErrors.length})`);
  await context.close();
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
