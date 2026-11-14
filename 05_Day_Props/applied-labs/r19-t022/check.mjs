import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T022');

// Expected results live here, separate from example.jsx: [id, input, text, status]
const EXPECTED = {
  'Contract': [
    ['basic', 'value=3, max=5', '3/5', 'ok'],
    ['default-max', 'value=4 (default max 5)', '4/5', 'ok'],
  ],
  'Empty input': [
    ['missing', 'no value', 'Not rated', 'empty'],
    ['null', 'value=null', 'Not rated', 'empty'],
    ['empty-string', 'value=""', 'Not rated', 'empty'],
  ],
  'Boundary (0 <= value <= max, inclusive)': [
    ['zero', 'value=0, max=5', '0/5', 'ok'],
    ['at-max', 'value=5, max=5', '5/5', 'ok'],
    ['max-one', 'value=1, max=1', '1/1', 'ok'],
    ['just-above', 'value=5.1, max=5', 'Out of range', 'out-of-range'],
    ['above-max', 'value=6, max=5', 'Out of range', 'out-of-range'],
    ['negative', 'value=-1, max=5', 'Out of range', 'out-of-range'],
  ],
  'Invalid input': [
    ['nan', 'value=NaN', 'Invalid value', 'invalid-value'],
    ['string', 'value="3"', 'Invalid value', 'invalid-value'],
    ['max-zero', 'value=3, max=0', 'Invalid max', 'invalid-max'],
    ['max-fraction', 'value=1, max=2.5', 'Invalid max', 'invalid-max'],
  ],
};

const steps = [];
const problems = [];
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

try {
  // Launch the local app.
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5198 },
  });
  await server.listen();
  const origin = new URL(server.resolvedUrls.local[0]).origin;

  // Launch the browser.
  browser = await chromium.launch();
  chromiumVersion = browser.version();
  const page = await browser.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));

  await page.goto(`${origin}/`);

  await step('Page renders', 'open /', 'heading "Rating props lab"', async () => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rating props lab');
    return await page.getByRole('heading', { level: 1 }).textContent();
  });

  for (const [group, cases] of Object.entries(EXPECTED)) {
    for (const [id, input, text, status] of cases) {
      await step(`${group}: ${input}`, input, `${text} (${status})`, async () => {
        const rating = page.getByTestId(`case-${id}`).getByTestId('rating');
        await expect(rating).toHaveText(text);
        await expect(rating).toHaveAttribute('data-status', status);
        return `${await rating.textContent()} (${await rating.getAttribute('data-status')})`;
      });
    }
  }

  await step('No console or page errors', 'whole page', 'no errors collected', async () => {
    expect(problems).toEqual([]);
    return problems;
  });
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
  task: 'R19-T022',
  passed: !failed,
  versions: {
    node: process.version,
    vite: pkgVersion('vite'),
    react: pkgVersion('react'),
    reactDom: pkgVersion('react-dom'),
    playwrightTest: pkgVersion('@playwright/test'),
    chromium: chromiumVersion,
  },
  steps,
};
writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);