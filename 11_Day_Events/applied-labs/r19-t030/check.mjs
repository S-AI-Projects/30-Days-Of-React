import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T030');

const NO_PAYLOAD = 'No payload yet';
const ADA = '{"name":"Ada Lovelace","email":"ada@example.com"}';
const state = (nameError, emailError, payload, submissions) => ({ nameError, emailError, payload, submissions });

async function fillAndSubmit(page, name, email) {
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Submit' }).click();
}

// General contract session. Hand-written expectations, independent of example.jsx.
const CONTRACT = [
  { label: 'initial state', run: async () => {}, expected: state('', '', NO_PAYLOAD, 0) },
  { label: 'blank form is blocked', run: (p) => p.getByRole('button', { name: 'Submit' }).click(),
    expected: state('Name is required', 'Email is required', NO_PAYLOAD, 0) },
  { label: 'invalid email is blocked', run: (p) => fillAndSubmit(p, 'Ada', 'not-an-email'),
    expected: state('', 'Enter a valid email address', NO_PAYLOAD, 0) },
  { label: 'valid data produces one normalized payload', run: (p) => fillAndSubmit(p, '  Ada   Lovelace ', '  Ada@Example.COM '),
    expected: state('', '', ADA, 1) },
  { label: 'Enter in the email field submits exactly once more', run: async (p) => {
      await p.getByLabel('Email', { exact: true }).focus();
      await p.keyboard.press('Enter');
    },
    expected: state('', '', ADA, 2) },
];

async function expectState(page, expected, timeout) {
  await expect(page.getByTestId('name-error')).toHaveText(expected.nameError, { timeout });
  await expect(page.getByTestId('email-error')).toHaveText(expected.emailError, { timeout });
  await expect(page.getByTestId('payload')).toHaveText(expected.payload, { timeout });
  await expect(page.getByTestId('submissions')).toHaveText(String(expected.submissions), { timeout });
}

// Focused regression test: a name of only spaces must be blocked.
async function focusedWhitespaceNameTest(page, timeout) {
  await fillAndSubmit(page, '   ', 'ada@example.com');
  await expect(page.getByTestId('name-error')).toHaveText('Name is required', { timeout });
  await expect(page.getByTestId('payload')).toHaveText(NO_PAYLOAD, { timeout });
  await expect(page.getByTestId('submissions')).toHaveText('0', { timeout });
}

// Temporary one-line mutant, applied in memory only: name.trim() === '' becomes name === ''.
let mutantApplied = false;
function oneLineMutant() {
  return {
    name: 'one-line-mutant',
    enforce: 'pre',
    transform(code, id) {
      if (!id.split('?')[0].endsWith('example.jsx')) return null;
      const mutated = code.replace(/name\.trim\(\)\s*===\s*(?:''|"")/, "name === ''");
      if (mutated !== code) mutantApplied = true;
      return { code: mutated, map: null };
    },
  };
}

const steps = [];
const problems = [];
const report = { mutant: "name.trim() === '' changed to name === ''" };
let failed = false;
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

async function start(port, extra = {}) {
  const server = await createServer({ root: labDir, logLevel: 'error', server: { port }, ...extra });
  await server.listen();
  return { server, origin: new URL(server.resolvedUrls.local[0]).origin };
}

async function openPage(origin, label) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${label} console error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`${label} page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`${label} request failed: ${r.url()}`));
  await page.goto(`${origin}/`);
  return { context, page };
}

try {
  // Launch the browser.
  browser = await chromium.launch();
  chromiumVersion = browser.version();

  // Phase A: the correct example.
  {
    const { server, origin } = await start(5188);
    try {
      const { context, page } = await openPage(origin, 'correct');
      for (const item of CONTRACT) {
        await step(`Contract: ${item.label}`, item.label, JSON.stringify(item.expected), async () => {
          await item.run(page);
          await expectState(page, item.expected, 5000);
          return item.expected;
        });
      }
      await context.close();

      await step('Focused test PASSES on the correct example (a name of only spaces is blocked)', 'name "   ", valid email', 'Name is required, no payload, 0 submissions', async () => {
        const fresh = await openPage(origin, 'correct focused');
        await focusedWhitespaceNameTest(fresh.page, 5000);
        await fresh.context.close();
        report.focusedOnCorrect = 'passed';
        return 'passed';
      });
    } finally {
      await server.close();
    }
  }

  // Phase B: the same app with the temporary one-line mutant.
  {
    const { server, origin } = await start(5187, {
      plugins: [oneLineMutant()],
      cacheDir: resolve(labDir, 'node_modules/.vite-mutant'),
    });
    try {
      await step('The one-line mutant is applied to the served example', 'serve a copy with the mutant', 'mutant applied in memory', async () => {
        const fresh = await openPage(origin, 'mutant probe');
        await fresh.context.close();
        expect(mutantApplied).toBe(true);
        return 'applied';
      });

      await step('The general contract session alone does NOT catch the mutant (it survives)', 'run the contract session on the mutant', 'all five contract steps still pass', async () => {
        const fresh = await openPage(origin, 'mutant contract');
        for (const item of CONTRACT) {
          await item.run(fresh.page);
          await expectState(fresh.page, item.expected, 5000);
        }
        await fresh.context.close();
        report.contractOnMutant = 'passed (the mutant survives)';
        return 'survives';
      });

      await step('Focused test FAILS on the mutant (the mutant is killed)', 'name "   ", valid email, on the mutant', 'the focused test throws', async () => {
        const fresh = await openPage(origin, 'mutant focused');
        let killedBy = null;
        try {
          await focusedWhitespaceNameTest(fresh.page, 1500);
        } catch (error) {
          killedBy = String(error.message).split('\n')[0];
        }
        await fresh.context.close();
        expect(killedBy).not.toBeNull();
        report.focusedOnMutant = `failed: ${killedBy}`;
        return `failed: ${killedBy}`;
      });
    } finally {
      await server.close();
    }
  }

  await step('The mutant never touched the file on disk', 'read example.jsx', "still contains name.trim() === ''", async () => {
    const source = readFileSync(resolve(labDir, 'example.jsx'), 'utf8');
    expect(source).toContain("name.trim() === ''");
    return 'unchanged';
  });

  await step('No console or page errors', 'all pages', 'no errors collected', async () => {
    expect(problems).toEqual([]);
    return problems;
  });
} catch (error) {
  failed = true;
  console.error('Setup error:', error);
} finally {
  await browser?.close();
}

// Save evidence for the PR.
mkdirSync(workDir, { recursive: true });
writeFileSync(
  resolve(workDir, 'results.json'),
  JSON.stringify(
    {
      task: 'R19-T030',
      passed: !failed,
      versions: {
        node: process.version,
        vite: pkgVersion('vite'),
        react: pkgVersion('react'),
        reactDom: pkgVersion('react-dom'),
        playwrightTest: pkgVersion('@playwright/test'),
        chromium: chromiumVersion,
      },
      ...report,
      expectedContractTable: CONTRACT.map(({ label, expected }) => ({ step: label, expected })),
      steps,
    },
    null,
    2,
  ) + '\n',
);

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);