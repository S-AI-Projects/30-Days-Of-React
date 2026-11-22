import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T029');

// Hand-written expectations, independent of example.jsx.
// A 200 response costs 1 adapter call and 2 Loader renders (loading, then loaded), whatever the size.
const SIZES = [
  { id: 'size-1', rows: 1, first: 'Item 1', last: 'Item 1' },
  { id: 'size-10', rows: 10, first: 'Item 1', last: 'Item 10' },
  { id: 'size-100', rows: 100, first: 'Item 1', last: 'Item 100' },
];

const steps = [];
const problems = [];
const external = [];
const measured = [];
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

async function readLoader(page) {
  const items = page.getByTestId('items').locator('li');
  const rows = await items.count();
  return {
    status: await page.getByTestId('status').textContent(),
    rows,
    first: rows ? await items.first().textContent() : null,
    last: rows ? await items.last().textContent() : null,
    calls: Number(await page.getByTestId('calls').textContent()),
    renders: Number(await page.getByTestId('renders').textContent()),
  };
}

async function runSize(page, size, record) {
  await page.getByTestId(`scenario-${size.id}`).click();
  await expect(page.getByTestId('status')).toHaveText('Loaded');
  const actual = await readLoader(page);
  expect(actual).toEqual({ status: 'Loaded', rows: size.rows, first: size.first, last: size.last, calls: 1, renders: 2 });
  if (record) measured.push({ scenario: size.id, ...actual });
  return actual;
}

try {
  // Launch the local app.
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5191 },
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
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) external.push(r.url());
  });

  await page.goto(`${origin}/`);

  await step('Size 1: 200 response renders 1 row (1 adapter call, 2 renders)', 'select the 1-item fixture', 'rows 1, calls 1, renders 2', async () => {
    await expect(page.getByTestId('idle')).toHaveText('No fixture selected');
    return await runSize(page, SIZES[0], true);
  });

  await step('Size 10: 200 response renders 10 rows (1 adapter call, 2 renders)', 'select the 10-item fixture', 'rows 10, calls 1, renders 2', async () => {
    return await runSize(page, SIZES[1], true);
  });

  await step('Size 100: 200 response renders 100 rows (1 adapter call, 2 renders)', 'select the 100-item fixture', 'rows 100, calls 1, renders 2', async () => {
    return await runSize(page, SIZES[2], true);
  });

  await step('Rejected request shows the error state with a Retry button', 'select the reject-then-retry fixture', 'Error: Network down, rows 0, calls 1, renders 2', async () => {
    await page.getByTestId('scenario-reject-retry').click();
    await expect(page.getByTestId('status')).toHaveText('Error: Network down');
    const actual = await readLoader(page);
    expect(actual).toEqual({ status: 'Error: Network down', rows: 0, first: null, last: null, calls: 1, renders: 2 });
    await expect(page.getByTestId('retry')).toBeVisible();
    measured.push({ scenario: 'reject-retry (rejected)', ...actual });
    return actual;
  });

  await step('Retry succeeds: 3 rows, 2 adapter calls, 4 renders', 'click Retry', 'Loaded, rows 3, calls 2, renders 4', async () => {
    await page.getByTestId('retry').click();
    await expect(page.getByTestId('status')).toHaveText('Loaded');
    const actual = await readLoader(page);
    expect(actual).toEqual({ status: 'Loaded', rows: 3, first: 'Item 1', last: 'Item 3', calls: 2, renders: 4 });
    await expect(page.getByTestId('retry')).toHaveCount(0);
    measured.push({ scenario: 'reject-retry (after retry)', ...actual });
    return actual;
  });

  await step('Operation counts do not grow with input size (rows grow 1, 10, 100)', 'compare the three sizes', 'same adapter calls and renders, rows 1, 10, 100', async () => {
    const sizes = measured.filter((m) => m.scenario.startsWith('size-'));
    expect(sizes.map((m) => m.rows)).toEqual([1, 10, 100]);
    expect(new Set(sizes.map((m) => m.calls)).size).toBe(1);
    expect(new Set(sizes.map((m) => m.renders)).size).toBe(1);
    return sizes.map((m) => `${m.rows} rows: ${m.calls} call, ${m.renders} renders`).join('; ');
  });

  await step('Repeating a size remounts the Loader and gives identical counts', 'select the 10-item fixture again', 'rows 10, calls 1, renders 2', async () => {
    return await runSize(page, SIZES[1], false);
  });

  await step('No live API call: no external request and no network call in the source', 'requests and example.jsx', 'none', async () => {
    const source = readFileSync(resolve(labDir, 'example.jsx'), 'utf8');
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain('XMLHttpRequest');
    expect(external).toEqual([]);
    return 'none';
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

console.log('\nOperation counts (reported, no timing threshold):');
for (const m of measured) {
  console.log(`  ${m.scenario}: rows=${m.rows} adapterCalls=${m.calls} loaderRenders=${m.renders}`);
}

// Save evidence for the PR.
mkdirSync(workDir, { recursive: true });
const report = {
  task: 'R19-T029',
  note: 'correctness plus operation and render counts; no speed threshold',
  passed: !failed,
  versions: {
    node: process.version,
    vite: pkgVersion('vite'),
    react: pkgVersion('react'),
    reactDom: pkgVersion('react-dom'),
    playwrightTest: pkgVersion('@playwright/test'),
    chromium: chromiumVersion,
  },
  operationCounts: measured,
  steps,
};
writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);