import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T025');

// Hand-written expected results (independent of example.jsx).
const REQ = {
  a1p: '#1 alpha: pending',
  a1pa: '#1 alpha: pending (aborted)',
  a1ra: '#1 alpha: resolved (aborted)',
  b2p: '#2 beta: pending',
  b2r: '#2 beta: resolved',
  g3p: '#3 gamma: pending',
  g3f: '#3 gamma: failed',
  a4p: '#4 alpha: pending',
  a4r: '#4 alpha: resolved',
  b5p: '#5 beta: pending',
  b5pa: '#5 beta: pending (aborted)',
  b5fa: '#5 beta: failed (aborted)',
  g6p: '#6 gamma: pending',
  g6r: '#6 gamma: resolved',
};
const state = (status, data, error, requests) => ({ status, data, error, requests });

const ACTIONS = [
  { type: 'none', label: 'initial state',
    expected: state('Idle', null, null, []) },
  { type: 'select', key: 'alpha', label: 'select alpha (request #1 starts)',
    expected: state('Loading', null, null, [REQ.a1p]) },
  { type: 'select', key: 'beta', label: 'select beta while #1 is pending (#1 is aborted)',
    expected: state('Loading', null, null, [REQ.a1pa, REQ.b2p]) },
  { type: 'release', id: 2, label: 'release #2 (beta response arrives)',
    expected: state('Success', 'Beta data', null, [REQ.a1pa, REQ.b2r]) },
  { type: 'release', id: 1, label: 'release #1 (late alpha response is ignored)',
    expected: state('Success', 'Beta data', null, [REQ.a1ra, REQ.b2r]) },
  { type: 'select', key: 'gamma', label: 'select gamma (loading resets, data clears)',
    expected: state('Loading', null, null, [REQ.a1ra, REQ.b2r, REQ.g3p]) },
  { type: 'fail', id: 3, label: 'fail #3 (gamma error is shown)',
    expected: state('Error', null, 'Failed to load gamma', [REQ.a1ra, REQ.b2r, REQ.g3f]) },
  { type: 'select', key: 'alpha', label: 'select alpha (error clears, loading resets)',
    expected: state('Loading', null, null, [REQ.a1ra, REQ.b2r, REQ.g3f, REQ.a4p]) },
  { type: 'release', id: 4, label: 'release #4 (alpha response arrives)',
    expected: state('Success', 'Alpha data', null, [REQ.a1ra, REQ.b2r, REQ.g3f, REQ.a4r]) },
  { type: 'select', key: 'alpha', label: 'select alpha again (same key, no new request)',
    expected: state('Success', 'Alpha data', null, [REQ.a1ra, REQ.b2r, REQ.g3f, REQ.a4r]) },
  { type: 'select', key: 'beta', label: 'select beta (request #5 starts)',
    expected: state('Loading', null, null, [REQ.a1ra, REQ.b2r, REQ.g3f, REQ.a4r, REQ.b5p]) },
  { type: 'select', key: 'gamma', label: 'select gamma while #5 is pending (#5 is aborted)',
    expected: state('Loading', null, null, [REQ.a1ra, REQ.b2r, REQ.g3f, REQ.a4r, REQ.b5pa, REQ.g6p]) },
  { type: 'fail', id: 5, label: 'fail #5 (late beta error is ignored)',
    expected: state('Loading', null, null, [REQ.a1ra, REQ.b2r, REQ.g3f, REQ.a4r, REQ.b5fa, REQ.g6p]) },
  { type: 'release', id: 6, label: 'release #6 (gamma response arrives)',
    expected: state('Success', 'Gamma data', null, [REQ.a1ra, REQ.b2r, REQ.g3f, REQ.a4r, REQ.b5fa, REQ.g6r]) },
];

const steps = [];
const problems = [];
const external = [];
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

async function readState(page) {
  const text = async (id) =>
    (await page.getByTestId(id).count()) ? await page.getByTestId(id).textContent() : null;
  return {
    status: await text('status'),
    data: await text('data'),
    error: await text('error'),
    requests: await page
      .getByTestId('requests')
      .locator('li')
      .evaluateAll((items) => items.map((li) => li.getAttribute('data-summary'))),
  };
}

async function perform(page, action) {
  if (action.type === 'select') await page.getByTestId(`key-${action.key}`).click();
  else if (action.type === 'release') await page.getByTestId(`release-${action.id}`).click();
  else if (action.type === 'fail') await page.getByTestId(`fail-${action.id}`).click();
}

// Perform one action, then wait (no sleeping) until the page shows the target state.
async function playAction(page, action, target) {
  await perform(page, action);
  let last;
  await expect.poll(async () => (last = await readState(page))).toEqual(target);
  return last;
}

// One complete run in its own browser context: fresh storage, fresh page, fresh app.
async function playRun(origin, label, targetFor, asSteps) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${label} console error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`${label} page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`${label} request failed: ${r.url()}`));
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) {
      external.push(`${label}: ${r.url()}`);
    }
  });
  await page.goto(`${origin}/`);

  const transcript = [];
  for (const [i, action] of ACTIONS.entries()) {
    const target = targetFor(i);
    if (asSteps) {
      await step(`Step ${i}: ${action.label}`, action.label, target, async () => {
        const snapshot = await playAction(page, action, target);
        transcript.push(snapshot);
        return snapshot;
      });
    } else {
      transcript.push(await playAction(page, action, target));
    }
  }
  await context.close();
  return transcript;
}

let run1 = [];
let run2 = [];
try {
  // Launch the local app.
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5195 },
  });
  await server.listen();
  const origin = new URL(server.resolvedUrls.local[0]).origin;

  // Launch the browser.
  browser = await chromium.launch();
  chromiumVersion = browser.version();

  // Run 1 is judged against the hand-written table.
  run1 = await playRun(origin, 'run 1', (i) => ACTIONS[i].expected, true);

  // Run 2 starts from scratch in a new browser context and must match run 1 at every step.
  await step(
    'Run 2 (fresh browser context) matches Run 1 at every step',
    `replay all ${ACTIONS.length} actions`,
    'same snapshot as Run 1 after each action',
    async () => {
      run2 = await playRun(origin, 'run 2', (i) => run1[i], false);
      return `${run2.length} snapshots`;
    },
  );

  await step('Two isolated runs agree', 'compare both transcripts', 'identical', async () => {
    expect(run2).toEqual(run1);
    return 'identical';
  });

  await step('No requests leave localhost', 'all requests in both runs', 'no external requests', async () => {
    expect(external).toEqual([]);
    return external;
  });

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
  task: 'R19-T025',
  injected: 'network (manual fixture source); no timers, no storage',
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
  run1,
  run2,
  steps,
};
writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);