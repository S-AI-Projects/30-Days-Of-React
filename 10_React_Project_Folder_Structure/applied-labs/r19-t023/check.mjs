import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T023');

// Oracle 1: hand-written expected-result table (independent of example.jsx).
// "expected" is the count that must be on screen after the action.
const ACTIONS = [
  { type: 'click', label: 'click Increment', expected: 1 },
  { type: 'key', key: '+', label: 'press +', expected: 2 },
  { type: 'key', key: 'a', label: 'press a (irrelevant)', expected: 2 },
  { type: 'key', key: 'Escape', label: 'press Escape (irrelevant)', expected: 2 },
  { type: 'key', key: 'ArrowUp', label: 'press ArrowUp (irrelevant)', expected: 2 },
  { type: 'key', key: '=', label: 'press = (unshifted + key, irrelevant)', expected: 2 },
  { type: 'key', key: '-', label: 'press - (irrelevant)', expected: 2 },
  { type: 'hold', key: '+', label: 'hold + (auto-repeat counts once)', expected: 3 },
  { type: 'click', label: 'click Increment', expected: 4 },
  { type: 'key', key: '+', label: 'press +', expected: 5 },
  { type: 'button-enter', label: 'Enter on the focused button (a click)', expected: 6 },
];

// Oracle 2: a tiny reference model written separately from the component.
// Each click, each "+" keydown without repeat, and Enter on the button adds one.
function reference(actions) {
  let count = 0;
  for (const a of actions) {
    if (a.type === 'click' || a.type === 'button-enter') count += 1;
    else if ((a.type === 'key' || a.type === 'hold') && a.key === '+') count += 1;
  }
  return count;
}

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

async function perform(page, action) {
  const button = page.getByRole('button', { name: /Increment/ });
  if (action.type === 'click') {
    await button.click();
  } else if (action.type === 'key') {
    await page.keyboard.press(action.key);
  } else if (action.type === 'hold') {
    // Pressing down again without releasing sends auto-repeat keydowns.
    await page.keyboard.down(action.key);
    await page.keyboard.down(action.key);
    await page.keyboard.down(action.key);
    await page.keyboard.up(action.key);
  } else if (action.type === 'button-enter') {
    await button.focus();
    await page.keyboard.press('Enter');
  }
}

try {
  // Launch the local app.
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5197 },
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

  await step('Page renders with count 0', 'open /', 'heading and count "0"', async () => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Button and shortcut lab');
    await expect(page.getByTestId('count')).toHaveText('0');
    return await page.getByTestId('count').textContent();
  });

  for (let i = 0; i < ACTIONS.length; i++) {
    const action = ACTIONS[i];
    const modelExpected = reference(ACTIONS.slice(0, i + 1));
    await step(
      `Step ${i + 1}: ${action.label}`,
      action.label,
      `count ${action.expected} (reference model: ${modelExpected})`,
      async () => {
        // The two oracles must agree with each other before the page is judged.
        expect(modelExpected).toBe(action.expected);
        await perform(page, action);
        await expect(page.getByTestId('count')).toHaveText(String(action.expected));
        return `count ${await page.getByTestId('count').textContent()}`;
      },
    );
  }

  await step('No console or page errors', 'whole run', 'no errors collected', async () => {
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
  task: 'R19-T023',
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
  steps,
};
writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);