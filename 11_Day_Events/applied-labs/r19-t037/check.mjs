// Playwright check for the R19-T037 applied lab.
// Run from the repository root: node 11_Day_Events/applied-labs/r19-t037/check.mjs
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

  const submit = page.getByTestId('submit-button');
  const nameInput = page.getByTestId('name-input');
  const emailInput = page.getByTestId('email-input');

  // Blank form: submit is blocked, no errors shown yet, no payload.
  check(await submit.isDisabled(), 'submit is disabled on a blank form');
  check((await textOrNull(page, 'payload')) === null, 'no payload on a blank form');

  // Invalid email: the error appears inline and submit stays blocked.
  await nameInput.fill('Ada');
  await emailInput.fill('not-an-email');
  check(
    (await textOrNull(page, 'email-error')) === 'Enter a valid email address.',
    'invalid email shows the inline error'
  );
  check(await submit.isDisabled(), 'submit stays disabled with an invalid email');
  check((await textOrNull(page, 'payload')) === null, 'no payload with an invalid email');

  // Fixed email: the error clears and submit is enabled.
  await emailInput.fill('ada@example.com');
  check((await textOrNull(page, 'email-error')) === null, 'email error clears once the email is valid');
  check(await submit.isEnabled(), 'submit is enabled once the form is valid');

  // Messy input is normalized into one payload on submit.
  await nameInput.fill('  Ada Lovelace  ');
  await emailInput.fill('ADA@Example.COM');
  await submit.click();
  check(
    (await textOrNull(page, 'payload')) === '{"name":"Ada Lovelace","email":"ada@example.com"}',
    'valid submit produces the normalized payload'
  );

  // Editing after submit clears the payload — it was built from the old input.
  await emailInput.fill('ada@example.com');
  check((await textOrNull(page, 'payload')) === null, 'editing after submit clears the payload');

  // Blank name: the error appears inline and submit is blocked again.
  await nameInput.fill('');
  check(
    (await textOrNull(page, 'name-error')) === 'Name is required.',
    'blank name shows the inline error'
  );
  check(await submit.isDisabled(), 'submit is disabled with a blank name');

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
