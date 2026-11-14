/**
 * check.mjs — R19-T008 Automated Playwright Verification
 *
 * Verifies the capstone task board: blank tasks are rejected, valid tasks are
 * accepted, and filter/complete behaviors work without console errors.
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { createRequire } from 'node:module';

// Resolve playwright from the repo root node_modules regardless of CWD
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const require = createRequire(path.join(repoRoot, 'package.json'));
const { chromium } = require('playwright');

const SCREENSHOT_PATH = path.resolve(__dirname, '../../../work/R19-T008/screenshot.png');

const HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>R19-T008 Task Board Lab</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      const { useRef, useState, createElement: h } = React;

      const INITIAL_TASKS = [
        { id: 1, text: 'Write docs', completed: false },
        { id: 2, text: 'Ship demo', completed: true },
      ];

      function TaskBoardLab() {
        const [tasks, setTasks] = useState(INITIAL_TASKS);
        const [newTask, setNewTask] = useState('');
        const [filter, setFilter] = useState('all');
        const [error, setError] = useState('');
        const nextId = useRef(3);

        const visibleTasks = tasks.filter((task) => {
          if (filter === 'active') return !task.completed;
          if (filter === 'completed') return task.completed;
          return true;
        });

        const addTask = () => {
          const value = newTask.trim();
          if (!value) {
            setError('Task cannot be blank.');
            return;
          }

          setTasks((current) => [...current, { id: nextId.current++, text: value, completed: false }]);
          setNewTask('');
          setError('');
        };

        const toggleTask = (taskId) => {
          setTasks((current) =>
            current.map((task) =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            )
          );
        };

        return h('div', { style: { fontFamily: 'sans-serif', padding: '2rem', maxWidth: '640px' } },
          h('h2', null, 'Task Board'),
          h('div', { id: 'task-form', style: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' } },
            h('input', {
              id: 'task-input',
              value: newTask,
              onChange: (event) => setNewTask(event.target.value),
              placeholder: 'Add a task',
              'aria-label': 'Task name',
              style: { flex: 1, padding: '0.5rem' },
            }),
            h('button', { id: 'add-task-btn', type: 'button', onClick: addTask }, 'Add Task')
          ),
          error && h('p', { id: 'error-message', style: { color: 'crimson', marginBottom: '0.75rem' } }, error),
          h('div', { id: 'filters', style: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' } },
            h('button', { id: 'filter-all', type: 'button', onClick: () => setFilter('all') }, 'All'),
            h('button', { id: 'filter-active', type: 'button', onClick: () => setFilter('active') }, 'Active'),
            h('button', { id: 'filter-completed', type: 'button', onClick: () => setFilter('completed') }, 'Completed')
          ),
          h('ul', { id: 'task-list', style: { listStyle: 'none', padding: 0, margin: 0 } },
            visibleTasks.map((task) => h('li', {
              key: task.id,
              id: 'task-' + task.id,
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: '1px solid #e5e5e5',
              },
            },
              h('span', {
                id: 'task-text-' + task.id,
                style: {
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? '#666' : '#111',
                },
              }, task.text),
              h('button', { id: 'complete-' + task.id, type: 'button', onClick: () => toggleTask(task.id) }, task.completed ? 'Undo' : 'Complete')
            ))
          )
        );
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(h(TaskBoardLab));
    </script>
  </body>
</html>`;

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    failures += 1;
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

async function runSuite(page, URL) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto(URL, { waitUntil: 'networkidle' });

  const initialCount = await page.locator('#task-list li').count();
  assert(initialCount === 2, `initial board renders 2 tasks (actual: ${initialCount})`);

  await page.click('#add-task-btn');
  const blankError = await page.locator('#error-message').textContent();
  assert(blankError && blankError.includes('Task cannot be blank.'), 'blank task submission is rejected');
  const countAfterBlank = await page.locator('#task-list li').count();
  assert(countAfterBlank === 2, 'rejected blank submission does not add a task');

  await page.fill('#task-input', 'Review PR');
  await page.click('#add-task-btn');
  const countAfterValidAdd = await page.locator('#task-list li').count();
  assert(countAfterValidAdd === 3, `valid task adds one new item (actual: ${countAfterValidAdd})`);

  const lastTaskText = await page.locator('#task-list li').last().locator('span').textContent();
  assert(lastTaskText && lastTaskText.trim() === 'Review PR', 'new valid task is appended to the board');

  await page.click('#complete-1');
  const activeAfterComplete = await page.locator('#task-list li').count();
  assert(activeAfterComplete === 3, 'task completion keeps the board stable');

  await page.click('#filter-active');
  const activeCount = await page.locator('#task-list li').count();
  assert(activeCount === 1, `active filter shows 1 active item (actual: ${activeCount})`);

  await page.click('#filter-completed');
  const completedCount = await page.locator('#task-list li').count();
  assert(completedCount >= 1, `completed filter shows completed items (actual: ${completedCount})`);

  const completedVisible = await page.locator('#task-list li').allTextContents();
  assert(completedVisible.some((text) => text.includes('Ship demo')), 'completed filter exposes completed tasks');

  assert(consoleErrors.length === 0, `zero console errors (got ${consoleErrors.length})`);
  assert(pageErrors.length === 0, `zero unhandled page errors (got ${pageErrors.length})`);

  return { consoleErrors: consoleErrors.length, pageErrors: pageErrors.length };
}

(async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const URL = `http://127.0.0.1:${port}`;

  console.log(`Server listening on ${URL}`);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    const result = await runSuite(page, URL);
    fs.mkdirSync(path.dirname(SCREENSHOT_PATH), { recursive: true });
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`📸 Screenshot saved → ${SCREENSHOT_PATH}`);
    console.log(`Console errors: ${result.consoleErrors}`);
    console.log(`Page errors: ${result.pageErrors}`);
    await page.close();
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n${'-'.repeat(50)}`);
  if (failures > 0) {
    console.error(`\n❌ ${failures} assertion(s) failed.`);
    process.exit(1);
  }

  console.log('\n✅ All assertions passed. Exit 0.');
  process.exit(0);
})();
