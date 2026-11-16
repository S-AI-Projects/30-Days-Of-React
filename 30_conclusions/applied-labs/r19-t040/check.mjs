// Playwright check for the R19-T040 applied lab.
// Run from the repository root: node 30_conclusions/applied-labs/r19-t040/check.mjs
// It builds the lab, serves it on http://localhost:4173, drives it in
// Chromium, then stops the server and closes the browser. Any failed
// assertion, or any console/page error, exits non-zero.
//
// The capstone sequence (one page session, no reload): add two tasks,
// complete one, filter completed — exactly one remains. Blank tasks
// are rejected. The focused test is the completed-filter assertion:
// it pins the decisive condition in example.jsx (the completed
// branch of visibleTasks), so flipping `t.done` to `!t.done` there
// must make this check fail.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  TASKS_TO_ADD,
  COMPLETE_INDEX,
  EXPECTED_COMPLETED,
  EXPECTED_ACTIVE,
} from './fixture.mjs';

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

async function taskCount(page) {
  return page.getByTestId('task-list').locator('li').count();
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

  // Empty board at the start.
  check((await page.getByTestId('empty-message').count()) === 1, 'empty board shows "No tasks."');

  // A blank task is rejected, with accessible feedback.
  await page.getByTestId('add-button').click();
  check((await page.getByTestId('task-list').count()) === 0, 'blank add adds no task');
  check(
    (await page.getByTestId('feedback').textContent()) === 'Task title is required.',
    'blank add announces the rejection'
  );

  // A whitespace-only task is rejected the same way.
  await page.getByTestId('task-input').fill('   ');
  await page.getByTestId('add-button').click();
  check((await page.getByTestId('task-list').count()) === 0, 'whitespace-only add adds no task');

  // Add the two fixture tasks.
  for (const title of TASKS_TO_ADD) {
    await page.getByTestId('task-input').fill(title);
    await page.getByTestId('add-button').click();
  }
  check((await taskCount(page)) === 2, 'two tasks added');
  check(
    (await page.getByTestId('feedback').textContent()) === 'Task added.',
    'adding announces "Task added."'
  );

  // Complete the first task.
  await page.getByTestId(`task-${COMPLETE_INDEX}-toggle`).click();
  check(
    (await page.getByTestId(`task-${COMPLETE_INDEX}`).getAttribute('data-done')) === 'true',
    'completed task is marked done'
  );
  check(
    (await page.getByTestId('feedback').textContent()) === 'Task completed.',
    'completing announces "Task completed."'
  );

  // Filter completed: exactly one remains, and it is the completed one.
  // This is the focused test — it pins the decisive condition.
  await page.getByTestId('filter-completed').click();
  check((await taskCount(page)) === 1, 'completed filter leaves exactly one task');
  const completedRow = page.getByTestId('task-list').locator('li').first();
  check(
    (await completedRow.locator('span').textContent()) === EXPECTED_COMPLETED,
    'completed filter shows the completed task'
  );
  check(
    (await completedRow.getAttribute('data-done')) === 'true',
    'completed filter shows a done task'
  );

  // Filter active: exactly one remains, the other task.
  await page.getByTestId('filter-active').click();
  check((await taskCount(page)) === 1, 'active filter leaves exactly one task');
  check(
    (await page.getByTestId('task-list').locator('li').first().locator('span').textContent()) ===
      EXPECTED_ACTIVE,
    'active filter shows the uncompleted task'
  );

  // Filter all: both tasks back.
  await page.getByTestId('filter-all').click();
  check((await taskCount(page)) === 2, 'all filter shows both tasks');

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
