// Playwright check for the R19-T034 applied lab.
// Run from the repository root: node 29_explore/applied-labs/r19-t034/check.mjs
// It builds the lab, serves it on http://localhost:4173, drives it in
// Chromium, then stops the server and closes the browser. Any failed
// assertion, or any console/page error, exits non-zero.
//
// The check runs a short sequence of operations — click, disabled click,
// keyboard selection, arrow-key focus, controlled update, controlled
// clear — and after every step asserts the lab's invariant: the readout,
// the aria-selected marks and the parent state agree (at most one option
// selected, the one the readout names), and a disabled option is never
// selected.
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

  // The invariant: the readout names exactly the option marked
  // aria-selected, and at most one option is marked. 'none' means no
  // option is marked.
  async function assertInvariant(expectedLabel, label) {
    const readout = await page.getByTestId('selected-readout').textContent();
    const selected = await page
      .locator('[role="option"][aria-selected="true"]')
      .allTextContents();
    const ok =
      readout === `Selected: ${expectedLabel}` &&
      (expectedLabel === 'none'
        ? selected.length === 0
        : selected.length === 1 && selected[0] === expectedLabel);
    check(ok, label);
  }

  // 1. Initial state: nothing selected.
  await assertInvariant('none', 'invariant holds at start: nothing selected');

  // 2. Click selects.
  await page.getByTestId('list-ada').click();
  await assertInvariant('Ada Lovelace', 'invariant holds after clicking Ada');

  // 3. A disabled item can never be selected: clicking it changes
  //    nothing. aria-disabled makes Playwright refuse a normal click
  //    (it treats the element as not enabled), so the click is forced:
  //    in a real browser aria-disabled does not block the click event,
  //    and the component's own guard is what must stop the selection.
  await page.getByTestId('list-grace').click({ force: true });
  check(
    (await page.getByTestId('list-grace').getAttribute('aria-selected')) === 'false',
    'disabled Grace stays unselected after a click'
  );
  await assertInvariant('Ada Lovelace', 'invariant still holds after clicking disabled Grace');

  // 4. Keyboard selection: focus an option, press Enter.
  await page.getByTestId('list-katherine').focus();
  await page.keyboard.press('Enter');
  await assertInvariant('Katherine Johnson', 'invariant holds after keyboard selection');

  // 5. Arrow keys move focus between options.
  await page.getByTestId('list-ada').focus();
  await page.keyboard.press('ArrowDown');
  const focused = await page.evaluate(() =>
    document.activeElement.getAttribute('data-testid')
  );
  check(focused === 'list-grace', 'ArrowDown moves focus from Ada to Grace');

  // 6. Controlled update: the parent sets the selection from outside
  //    the list.
  await page.getByTestId('select-ada').click();
  await assertInvariant('Ada Lovelace', 'invariant holds after a controlled update');

  // 7. Controlled clear.
  await page.getByTestId('clear-selection').click();
  await assertInvariant('none', 'invariant holds after clearing the selection');

  // 8. Empty list: a message, no options.
  check(
    (await page.getByTestId('empty-list-empty').textContent()) === 'No items.',
    'empty list shows the empty message'
  );
  check(
    (await page.locator('[role="option"]').count()) === 3,
    'empty list renders no extra options'
  );

  // 9. No console or page errors during the whole run.
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
