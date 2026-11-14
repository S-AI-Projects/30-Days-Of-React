/**
 * check.mjs — R19-T006 Automated Playwright Verification
 *
 * Verifies the explicit-state conditional rendering lab: loading, empty,
 * success, and error are each rendered from a single, predictable state value.
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_PATH = path.resolve(__dirname, '../../../work/R19-T006/screenshot.png');

const HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>R19-T006 Conditional Rendering Lab</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      const { useState, createElement: h } = React;

      const ITEMS = [
        { id: 1, name: 'Alpha' },
        { id: 2, name: 'Bravo' },
      ];

      function DataStateView({ status, items, onRetry }) {
        switch (status) {
          case 'loading':
            return h('section', { id: 'loading-view', 'aria-live': 'polite' },
              h('p', null, 'Loading your data...')
            );
          case 'empty':
            return h('section', { id: 'empty-view', 'aria-live': 'polite' },
              h('p', null, 'No items available.')
            );
          case 'error':
            return h('section', { id: 'error-view', 'aria-live': 'polite' },
              h('p', null, 'Something went wrong. Please try again.'),
              h('button', { id: 'retry-btn', type: 'button', onClick: onRetry }, 'Retry')
            );
          case 'success':
            return h('section', { id: 'success-view', 'aria-live': 'polite' },
              h('ul', { id: 'items-list' },
                items.map((item) => h('li', { key: item.id }, item.name))
              )
            );
          default:
            return null;
        }
      }

      function ConditionalStateLab() {
        const [status, setStatus] = useState('loading');

        const handleRetry = () => {
          setStatus('success');
        };

        return h('div', { style: { fontFamily: 'sans-serif', padding: '2rem' } },
          h('h2', null, 'Conditional Rendering State Lab'),
          h('div', { id: 'state-controls', style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } },
            h('button', { id: 'loading-btn', type: 'button', onClick: () => setStatus('loading') }, 'Loading'),
            h('button', { id: 'empty-btn', type: 'button', onClick: () => setStatus('empty') }, 'Empty'),
            h('button', { id: 'success-btn', type: 'button', onClick: () => setStatus('success') }, 'Success'),
            h('button', { id: 'error-btn', type: 'button', onClick: () => setStatus('error') }, 'Error')
          ),
          h('p', { id: 'status-line', style: { marginTop: '1rem' } },
            'Current state: ',
            h('strong', { id: 'status-value' }, status)
          ),
          h(DataStateView, { status, items: ITEMS, onRetry: handleRetry })
        );
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(h(ConditionalStateLab));
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

async function runSuite(page) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const initialText = await page.locator('#loading-view').textContent();
  assert(initialText && initialText.includes('Loading your data...'), 'initial state renders the loading view');

  await page.click('#empty-btn');
  const emptyText = await page.locator('#empty-view').textContent();
  assert(emptyText && emptyText.includes('No items available.'), 'empty button shows the empty state');

  await page.click('#success-btn');
  const successText = await page.locator('#success-view').textContent();
  const itemCount = await page.locator('#items-list li').count();
  assert(successText && successText.includes('Alpha') && successText.includes('Bravo'), 'success button renders both item names');
  assert(itemCount === 2, 'success view renders exactly 2 items');

  await page.click('#error-btn');
  const errorText = await page.locator('#error-view').textContent();
  const retryVisible = await page.locator('#retry-btn').isVisible();
  assert(errorText && errorText.includes('Something went wrong. Please try again.'), 'error button shows the error view');
  assert(retryVisible, 'error view exposes a retry button');

  await page.click('#retry-btn');
  const retryState = await page.locator('#status-value').textContent();
  assert(retryState && retryState.trim() === 'success', 'retry action returns to the success state');

  const finalSuccessText = await page.locator('#success-view').textContent();
  assert(finalSuccessText && finalSuccessText.includes('Alpha'), 'retry returns to the success view');

  assert(consoleErrors.length === 0, `zero console errors (got ${consoleErrors.length})`);
  assert(pageErrors.length === 0, `zero page errors (got ${pageErrors.length})`);

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
    await page.goto(URL, { waitUntil: 'networkidle' });
    const result = await runSuite(page);
    const screenshotDir = path.dirname(SCREENSHOT_PATH);
    fs.mkdirSync(screenshotDir, { recursive: true });
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
