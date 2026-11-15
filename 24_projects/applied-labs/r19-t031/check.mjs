// Playwright check for the R19-T031 applied lab.
// Run from the repository root: node 24_projects/applied-labs/r19-t031/check.mjs
// It builds the lab, serves it on http://localhost:4173, drives it in
// Chromium, then stops the server and closes the browser. Any failed
// assertion, or any console/page error, exits non-zero.
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

// Reads the text of an element that may not be rendered. Returns null
// instead of timing out, so a missing error fails its assertion cleanly.
async function textOrNull(page, testId) {
  if ((await page.getByTestId(testId).count()) === 0) return null;
  return page.getByTestId(testId).textContent();
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

  // 1. Fresh load: the empty form is invalid, no errors shown yet, summary empty.
  check((await page.getByTestId('form-status').textContent()) === 'Form is invalid.', 'fresh load: form is invalid');
  check((await page.getByTestId('summary').textContent()) === '', 'fresh load: summary is empty');
  check((await page.getByTestId('name-error').count()) === 0, 'fresh load: no name error shown');
  check((await page.getByTestId('email-error').count()) === 0, 'fresh load: no email error shown');

  // 2. Valid name, invalid email: the email error appears, the form stays invalid.
  await page.getByTestId('name-input').fill('Ada Lovelace');
  await page.getByTestId('email-input').fill('not-an-email');
  await page.getByTestId('email-input').blur();
  check((await textOrNull(page, 'email-error')) === 'Enter an email like ada@example.com.', 'invalid email shows its error');
  check((await page.getByTestId('form-status').textContent()) === 'Form is invalid.', 'invalid email: form is still invalid');

  // 3. Fix the email: the error clears, the form becomes valid, the summary derives.
  await page.getByTestId('email-input').fill('ada@example.com');
  check((await page.getByTestId('email-error').count()) === 0, 'fixed email: error clears');
  check((await page.getByTestId('form-status').textContent()) === 'Form is valid.', 'fixed email: form is valid');
  check((await page.getByTestId('summary').textContent()) === 'Ada Lovelace — ada@example.com', 'summary derives name and email');

  // 4. Submit while valid: the success message appears.
  await page.getByTestId('submit-button').click();
  check((await textOrNull(page, 'success-message')) === 'Profile saved.', 'valid submit shows success');

  // 5. Reset: fields clear, the status goes back to invalid, the summary
  //    empties and the success message disappears. Derived values cannot
  //    go stale after reset.
  await page.getByTestId('reset-button').click();
  check((await page.getByTestId('name-input').inputValue()) === '', 'reset: name is empty');
  check((await page.getByTestId('email-input').inputValue()) === '', 'reset: email is empty');
  check((await page.getByTestId('form-status').textContent()) === 'Form is invalid.', 'reset: form is invalid again');
  check((await page.getByTestId('summary').textContent()) === '', 'reset: summary is empty again');
  check((await page.getByTestId('success-message').count()) === 0, 'reset: success message is gone');

  // 6. Submit while empty: errors appear for both fields, no success.
  await page.getByTestId('submit-button').click();
  check((await textOrNull(page, 'name-error')) === 'Name is required.', 'empty submit: name error appears');
  check((await textOrNull(page, 'email-error')) === 'Email is required.', 'empty submit: email error appears');
  check((await page.getByTestId('success-message').count()) === 0, 'empty submit: no success message');

  // 7. No console or page errors during the whole run.
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
