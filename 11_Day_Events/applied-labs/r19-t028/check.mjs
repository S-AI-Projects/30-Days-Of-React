import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T028');

const BLOCKED = 'Blocked: fix the marked fields';
const NO_PAYLOAD = 'No payload yet';
const state = (nameError, emailError, payload, submissions, status) => ({ nameError, emailError, payload, submissions, status });

// Hand-written expected results, independent of example.jsx.
// The sequence shows a failure, then recovery on the next valid input, without a reload.
const ACTIONS = [
  { type: 'none', label: 'initial state (empty state, nothing submitted)',
    expected: state('', '', NO_PAYLOAD, 0, 'Waiting for input') },
  { type: 'submit', label: 'submit the blank form (failure: both fields blocked)',
    expected: state('Name is required', 'Email is required', NO_PAYLOAD, 0, BLOCKED) },
  { type: 'fill', field: 'Name', text: '  Ada   Lovelace ', label: 'type a name (its error clears while typing)',
    expected: state('', 'Email is required', NO_PAYLOAD, 0, BLOCKED) },
  { type: 'fill', field: 'Email', text: 'ada-at-example', label: 'type a malformed email (its error is re-checked)',
    expected: state('', 'Enter a valid email address', NO_PAYLOAD, 0, BLOCKED) },
  { type: 'submit', label: 'submit with the malformed email (still blocked)',
    expected: state('', 'Enter a valid email address', NO_PAYLOAD, 0, BLOCKED) },
  { type: 'fill', field: 'Email', text: '  Ada@Example.COM ', label: 'type a valid email (error clears)',
    expected: state('', '', NO_PAYLOAD, 0, BLOCKED) },
  { type: 'submit', label: 'submit (recovery: one normalized payload, no restart)',
    expected: state('', '', '{"name":"Ada Lovelace","email":"ada@example.com"}', 1, 'Submitted') },
  { type: 'fill', field: 'Name', text: '', label: 'blank the name (no error is shown before a submit)',
    expected: state('', '', '{"name":"Ada Lovelace","email":"ada@example.com"}', 1, 'Submitted') },
  { type: 'submit', label: 'submit with a blank name (blocked again, payload cleared)',
    expected: state('Name is required', '', NO_PAYLOAD, 1, BLOCKED) },
  { type: 'fill', field: 'Name', text: 'Grace Hopper', label: 'type a valid name (error clears)',
    expected: state('', '', NO_PAYLOAD, 1, BLOCKED) },
  { type: 'fill', field: 'Email', text: 'grace@navy.mil', label: 'type another valid email',
    expected: state('', '', NO_PAYLOAD, 1, BLOCKED) },
  { type: 'submit', label: 'submit (second recovery: a new normalized payload)',
    expected: state('', '', '{"name":"Grace Hopper","email":"grace@navy.mil"}', 2, 'Submitted') },
  { type: 'enter', label: 'press Enter in the email field (exactly one more submission)',
    expected: state('', '', '{"name":"Grace Hopper","email":"grace@navy.mil"}', 3, 'Submitted') },
];

const steps = [];
const problems = [];
const navigations = [];
let failed = false;
let server;
let browser;
let chromiumVersion = 'not launched';

async function step(name, input, expected, fn) {
  try {
    const actual = await fn();
    steps.push({ name, input, expected, actual, pass: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed = true;
    const message = String(error.message).split('\n')[0];
    steps.push({ name, input, expected, actual: message, pass: false });
    console.log(`FAIL  ${name}\n      ${message}`);
  }
}

function pkgVersion(name) {
  const file = resolve(labDir, 'node_modules', name, 'package.json');
  return JSON.parse(readFileSync(file, 'utf8')).version;
}

async function perform(page, action) {
  if (action.type === 'fill') {
    await page.getByLabel(action.field, { exact: true }).fill(action.text);
  } else if (action.type === 'submit') {
    await page.getByRole('button', { name: 'Submit' }).click();
  } else if (action.type === 'enter') {
    await page.getByLabel('Email', { exact: true }).focus();
    await page.keyboard.press('Enter');
  }
}

async function expectState(page, expected) {
  await expect(page.getByTestId('name-error')).toHaveText(expected.nameError);
  await expect(page.getByTestId('email-error')).toHaveText(expected.emailError);
  await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute('aria-invalid', String(expected.nameError !== ''));
  await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', String(expected.emailError !== ''));
  await expect(page.getByTestId('payload')).toHaveText(expected.payload);
  await expect(page.getByTestId('submissions')).toHaveText(String(expected.submissions));
  await expect(page.getByTestId('status')).toHaveText(expected.status);
}

async function readState(page) {
  return {
    nameError: await page.getByTestId('name-error').textContent(),
    emailError: await page.getByTestId('email-error').textContent(),
    payload: await page.getByTestId('payload').textContent(),
    submissions: Number(await page.getByTestId('submissions').textContent()),
    status: await page.getByTestId('status').textContent(),
  };
}

const run = [];
try {
  // Launch the local app.
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5192 },
  });
  await server.listen();
  const origin = new URL(server.resolvedUrls.local[0]).origin;

  // Launch the browser.
  browser = await chromium.launch();
  chromiumVersion = browser.version();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });

  await page.goto(`${origin}/`);
  // A marker that only survives while the page is never reloaded.
  await page.evaluate(() => {
    window.__example_alive = 'still running';
  });

  for (const [i, action] of ACTIONS.entries()) {
    await step(`Step ${i}: ${action.label}`, action.label, JSON.stringify(action.expected), async () => {
      await perform(page, action);
      await expectState(page, action.expected);
      const actual = await readState(page);
      run.push(actual);
      return actual;
    });
  }

  await step('The page never reloaded: failure and recovery happened in one session', 'marker set before step 0', 'marker still present, one navigation, URL unchanged', async () => {
    expect(await page.evaluate(() => window.__example_alive)).toBe('still running');
    expect(navigations).toEqual([`${origin}/`]);
    return 'one navigation';
  });

  await step('No console or page errors', 'whole run', 'no errors collected', async () => {
    expect(problems).toEqual([]);
    return problems;
  });

  await context.close();
} catch (error) {
  failed = true;
  console.error('Setup error:', error);
} finally {
  // Close the browser and the local app.
  await browser?.close();
  await server?.close();
}

// Save evidence for the PR.
mkdirSync(workDir, { recursive: true });
const report = {
  task: 'R19-T028',
  passed: !failed,
  versions: {
    node: process.version,
    vite: pkgVersion('vite'),
    react: pkgVersion('react'),
    reactDom: pkgVersion('react-dom'),
    playwrightTest: pkgVersion('@playwright/test'),
    chromium: chromiumVersion,
  },
  expectedTable: ACTIONS.map(({ label, expected }) => ({ action: label, expected })),
  actual: run,
  steps,
};
writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);