import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T021');
const BASE = '/course/';

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
  // Launch the local app (Vite dev server, base path /course/).
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5199 },
  });
  await server.listen();
  const origin = new URL(server.resolvedUrls.local[0]).origin;

  // Launch the browser.
  browser = await chromium.launch();
  chromiumVersion = browser.version();
  const page = await browser.newPage();

  // Collect anything that should count as an error.
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`);
  });

  await step('Home loads under /course/', `GET ${BASE}`, 'heading "Home"', async () => {
    await page.goto(origin + BASE);
    await expect(page.getByTestId('page-title')).toHaveText('Home');
    return await page.getByTestId('page-title').textContent();
  });

  await step('Logo asset loads from /course/logo.svg', 'img src + HTTP request', 'src "/course/logo.svg", HTTP 200 svg', async () => {
    await expect(page.getByTestId('logo')).toHaveAttribute('src', '/course/logo.svg');
    const res = await page.request.get(`${origin}${BASE}logo.svg`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('svg');
    return `src "${await page.getByTestId('logo').getAttribute('src')}", HTTP ${res.status()}`;
  });

  await step('Nav links keep the base path', 'read nav link hrefs', '/course/, /course/about, /course/countries', async () => {
    const hrefs = await page
      .locator('nav a')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(['/course/', '/course/about', '/course/countries']);
    return hrefs;
  });

  await step('Clicking About navigates under /course/', 'click "About" link', 'URL /course/about, heading "About"', async () => {
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(`${origin}/course/about`);
    await expect(page.getByTestId('page-title')).toHaveText('About');
    return `${new URL(page.url()).pathname}, heading "${await page.getByTestId('page-title').textContent()}"`;
  });

  await step('Page refresh preserves the route', 'reload on /course/about', 'still /course/about, heading "About"', async () => {
    await page.reload();
    await expect(page).toHaveURL(`${origin}/course/about`);
    await expect(page.getByTestId('page-title')).toHaveText('About');
    return `${new URL(page.url()).pathname}, heading "${await page.getByTestId('page-title').textContent()}"`;
  });

  await step('Countries route loads local data', `GET ${BASE}countries`, 'Finland, India, Japan', async () => {
    await page.goto(`${origin}/course/countries`);
    const items = page.getByTestId('country-list').locator('li');
    await expect(items).toHaveText(['Finland', 'India', 'Japan']);
    return await items.allTextContents();
  });

  await step('Unknown route shows Not found', `GET ${BASE}missing`, 'heading "Not found"', async () => {
    await page.goto(`${origin}/course/missing`);
    await expect(page.getByTestId('page-title')).toHaveText('Not found');
    return await page.getByTestId('page-title').textContent();
  });

  await step('No console or page errors', 'all pages above', 'no errors collected', async () => {
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
  task: 'R19-T021',
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