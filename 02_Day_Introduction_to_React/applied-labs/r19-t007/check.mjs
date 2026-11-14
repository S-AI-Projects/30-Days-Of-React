/**
 * check.mjs — R19-T007 Automated Playwright Verification
 *
 * Verifies the immutable filtered-total lab: compute a total from paid items
 * without mutating the original record array.
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_PATH = path.resolve(__dirname, '../../../work/R19-T007/screenshot.png');

const HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>R19-T007 Filtered Total Lab</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      const { createElement: h } = React;

      const records = [
        { id: 1, name: 'Alpha', amount: 10, paid: true },
        { id: 2, name: 'Bravo', amount: 5, paid: true },
        { id: 3, name: 'Charlie', amount: 20, paid: false },
      ];

      function derivePaidTotal(items) {
        return items
          .filter((item) => item.paid)
          .reduce((sum, item) => sum + item.amount, 0);
      }

      function FilteredTotalLab() {
        const paidTotal = derivePaidTotal(records);
        const snapshotBefore = JSON.stringify(records);
        const snapshotAfter = JSON.stringify(records);
        const unchanged = snapshotBefore === snapshotAfter;

        window.__APP__ = { records, total: paidTotal, unchanged };

        return h('div', { style: { fontFamily: 'sans-serif', padding: '2rem' } },
          h('h2', null, 'Filtered total without mutating inputs'),
          h('ul', { id: 'records-list', style: { marginBottom: '1rem' } },
            records.map((record) => h('li', { key: record.id },
              record.name + ': $' + record.amount + ' (' + (record.paid ? 'Paid' : 'Unpaid') + ')'
            ))
          ),
          h('p', { id: 'total-line' },
            'Paid total: ',
            h('strong', { id: 'total-value' }, String(paidTotal))
          ),
          h('p', { id: 'immutability-status' },
            'Original records unchanged: ',
            h('strong', null, String(unchanged))
          )
        );
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(h(FilteredTotalLab));
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

  const totalText = (await page.locator('#total-value').innerText()).trim();
  assert(totalText === '15', `total equals 15 (actual: ${totalText})`);

  const recordCount = await page.locator('#records-list li').count();
  assert(recordCount === 3, `three records remain visible (actual: ${recordCount})`);

  const immutableCheck = await page.evaluate(() => {
    const before = JSON.stringify(window.__APP__.records);
    const total = window.__APP__.records
      .filter((record) => record.paid)
      .reduce((sum, record) => sum + record.amount, 0);
    const after = JSON.stringify(window.__APP__.records);
    return before === after && total === 15;
  });
  assert(immutableCheck, 'source array is unchanged while computing the filtered total');

  const statusText = (await page.locator('#immutability-status').innerText()).trim();
  assert(statusText.includes('true'), `immutability status reports true (actual: ${statusText})`);

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
