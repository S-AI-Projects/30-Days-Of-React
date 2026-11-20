import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T026');

// Hand-written expected results, independent of both versions.
const ACTIONS = [
  { type: 'none', label: 'initial state', expected: 0 },
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

// Play every action against one version, in its own fresh browser context.
async function playRun(origin, version, label) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${label} console error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`${label} page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`${label} request failed: ${r.url()}`));
  await page.goto(`${origin}/?version=${version}`);

  const transcript = [];
  for (const action of ACTIONS) {
    await step(`${label}: ${action.label}`, action.label, `count ${action.expected}`, async () => {
      await expect(page.locator('main')).toHaveAttribute('data-version', version);
      await perform(page, action);
      await expect(page.getByTestId('count')).toHaveText(String(action.expected));
      const count = Number(await page.getByTestId('count').textContent());
      transcript.push(count);
      return `count ${count}`;
    });
  }
  await context.close();
  return transcript;
}

let baselineTranscript = [];
let refactoredTranscript = [];
try {
  // Launch the local app.
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5194 },
  });
  await server.listen();
  const origin = new URL(server.resolvedUrls.local[0]).origin;

  // Launch the browser.
  browser = await chromium.launch();
  chromiumVersion = browser.version();

  // 1. Capture the working version's behavior.
  baselineTranscript = await playRun(origin, 'baseline', 'Baseline');
  // 2. Play the identical actions against the refactor.
  refactoredTranscript = await playRun(origin, 'refactored', 'Refactored');

  await step(
    'Refactor keeps the contract: transcript equals the captured baseline',
    'both transcripts',
    JSON.stringify(baselineTranscript),
    async () => {
      expect(refactoredTranscript).toEqual(baselineTranscript);
      expect(baselineTranscript).toEqual(ACTIONS.map((a) => a.expected));
      return JSON.stringify(refactoredTranscript);
    },
  );

  await step(
    'The extracted responsibility is named and used by the component',
    'read baseline.jsx and example.jsx',
    'baseline wires keydown inline; refactor delegates to useKeyboardShortcut',
    async () => {
      const baselineApp = readFileSync(resolve(labDir, 'baseline.jsx'), 'utf8').split('export default function App')[1];
      const [hookPart, appPart] = readFileSync(resolve(labDir, 'example.jsx'), 'utf8').split('export default function App');
      expect(baselineApp).toContain('addEventListener');
      expect(hookPart).toContain('export function useKeyboardShortcut');
      expect(hookPart).toContain("addEventListener('keydown'");
      expect(appPart).toContain('useKeyboardShortcut(');
      expect(appPart).not.toContain('addEventListener');
      return 'extracted';
    },
  );

  await step('No console or page errors', 'both runs', 'no errors collected', async () => {
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
  task: 'R19-T026',
  refactor: 'extracted useKeyboardShortcut(key, onTrigger) from the inline keydown handling',
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
  baselineTranscript,
  refactoredTranscript,
  steps,
};
writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
