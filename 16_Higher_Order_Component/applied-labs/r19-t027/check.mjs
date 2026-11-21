import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T027');

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

// The published example: the JSON block in README.md is what gets executed.
function loadPublishedExample() {
  const readme = readFileSync(resolve(labDir, 'README.md'), 'utf8');
  const match = readme.match(/```json\n([\s\S]*?)\n```/);
  if (!match) throw new Error('README.md has no json block');
  return JSON.parse(match[1]).steps;
}

async function perform(page, example) {
  if (example.action === 'select') await page.getByTestId(`select-${example.id}`).click();
  else if (example.action === 'clear') await page.getByTestId('clear').click();
}

let published = [];
let initialListText = '';
const run = [];

try {
  // Launch the local app.
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5193 },
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

  await step(
    'The published example in README.md is present and covers selecting B and clearing',
    'parse the json block in README.md',
    'initial render, select B, clear, and no extra detail render for repeated actions',
    async () => {
      published = loadPublishedExample();
      const keys = published.map((s) => `${s.action}:${s.id ?? ''}`);
      expect(keys[0]).toBe('none:');
      expect(keys).toContain('select:B');
      expect(keys).toContain('clear:');
      // Repeating the same action must not cause another detail render.
      const repeated = published.filter((s, i) => i > 0 && s.action === published[i - 1].action && s.id === published[i - 1].id);
      expect(repeated.length).toBeGreaterThan(0);
      return `${published.length} steps`;
    },
  );

  await page.goto(`${origin}/`);
  initialListText = await page.getByTestId('list-panel').innerText();

  for (const [i, example] of published.entries()) {
    await step(
      `Published example step ${i + 1}: ${example.label}`,
      `${example.action}${example.id ? ' ' + example.id : ''}`,
      `state ${JSON.stringify(example.state)}; output "${example.output}"; renders list ${example.renders.list}, detail ${example.renders.detail}`,
      async () => {
        await perform(page, example);
        await expect(page.getByTestId('state')).toHaveText(JSON.stringify(example.state));
        await expect(page.getByTestId('detail-output')).toHaveText(example.output);
        await expect(page.getByTestId('detail-panel')).toHaveAttribute('data-renders', String(example.renders.detail));
        await expect(page.getByTestId('list-panel')).toHaveAttribute('data-renders', String(example.renders.list));
        expect(await page.getByTestId('list-panel').innerText()).toBe(initialListText);
        const actual = {
          state: await page.getByTestId('state').textContent(),
          output: await page.getByTestId('detail-output').textContent(),
          renders: {
            list: Number(await page.getByTestId('list-panel').getAttribute('data-renders')),
            detail: Number(await page.getByTestId('detail-panel').getAttribute('data-renders')),
          },
        };
        run.push(actual);
        return actual;
      },
    );
  }

  await step('The list content never changed across the whole sequence', 'compare the list before and after', 'identical', async () => {
    expect(await page.getByTestId('list-panel').innerText()).toBe(initialListText);
    return initialListText.replace(/\n/g, ' | ');
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
  task: 'R19-T027',
  publishedExample: 'json block in README.md, executed by this check',
  passed: !failed,
  versions: {
    node: process.version,
    vite: pkgVersion('vite'),
    react: pkgVersion('react'),
    reactDom: pkgVersion('react-dom'),
    playwrightTest: pkgVersion('@playwright/test'),
    chromium: chromiumVersion,
  },
  expected: published,
  actual: run,
  steps,
};
writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);