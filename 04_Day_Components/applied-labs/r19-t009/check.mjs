/**
 * check.mjs — R19-T009 Automated Playwright Verification
 *
 * Exercises reusable StatusBadge across bounded input scales (5, 20, 50),
 * tests pending, success, error, and unknown fallback states, and
 * verifies zero console errors and zero unhandled page errors.
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const require = createRequire(path.join(repoRoot, 'package.json'));
const { chromium } = require('playwright');

const SCREENSHOT_PATH = path.resolve(__dirname, '../../../work/R19-T009/screenshot.png');

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>R19-T009 Component Reuse Scale Lab</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</head>
<body>
<div id="root"></div>
<script>
  const { useState, createElement: h } = React;

  function StatusBadge({ status, label }) {
    const configs = {
      pending: { text: label || 'Pending', bg: '#fef3c7', color: '#92400e', border: '#f59e0b' },
      success: { text: label || 'Success', bg: '#d1fae5', color: '#065f46', border: '#10b981' },
      error:   { text: label || 'Error',   bg: '#fee2e2', color: '#991b1b', border: '#ef4444' },
    };

    const current = configs[status] || {
      text: label || 'Unknown Status',
      bg: '#f3f4f6',
      color: '#374151',
      border: '#9ca3af',
    };

    return h('span', {
      className: 'status-badge status-' + (status || 'unknown'),
      'data-status': status || 'unknown',
      style: {
        display: 'inline-block',
        padding: '0.25rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: 600,
        backgroundColor: current.bg,
        color: current.color,
        border: '1px solid ' + current.border,
        margin: '0.25rem',
      }
    }, current.text);
  }

  function ScaleExperimentLab() {
    const [scale, setScale] = useState(5);
    const [renderCount, setRenderCount] = useState(1);

    const statuses = ['pending', 'success', 'error', 'unknown', 'invalid-custom'];

    const items = Array.from({ length: scale }, (_, i) => ({
      id: i + 1,
      status: statuses[i % statuses.length],
      label: 'Item ' + (i + 1) + ' (' + statuses[i % statuses.length] + ')'
    }));

    const handleScaleChange = (newScale) => {
      setScale(newScale);
      setRenderCount(prev => prev + 1);
    };

    return h('div', { style: { fontFamily: 'sans-serif', padding: '2rem', maxWidth: '720px' } },
      h('h2', null, 'Day 4: Component Reuse — Input-Scale Experiment'),
      h('p', null, 'Testing reusable StatusBadge rendering across bounded input scales.'),
      h('div', { style: { marginBottom: '1rem', display: 'flex', gap: '0.5rem' } },
        h('button', { id: 'scale-5', type: 'button', onClick: () => handleScaleChange(5) }, 'Scale: 5'),
        h('button', { id: 'scale-20', type: 'button', onClick: () => handleScaleChange(20) }, 'Scale: 20'),
        h('button', { id: 'scale-50', type: 'button', onClick: () => handleScaleChange(50) }, 'Scale: 50'),
      ),
      h('div', { id: 'metrics', style: { marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' } },
        h('p', { style: { margin: '0.25rem 0' } }, 'Current Scale: ', h('strong', { id: 'current-scale' }, scale)),
        h('p', { style: { margin: '0.25rem 0' } }, 'Rendered Badges: ', h('strong', { id: 'badge-count' }, items.length)),
        h('p', { style: { margin: '0.25rem 0' } }, 'Render Operations: ', h('strong', { id: 'operation-count' }, renderCount))
      ),
      h('div', { id: 'badge-container', style: { display: 'flex', flexWrap: 'wrap', gap: '0.25rem' } },
        items.map(item => h(StatusBadge, { key: item.id, status: item.status, label: item.label }))
      )
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(h(ScaleExperimentLab));
</script>
</body>
</html>`;

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

async function runSuite(page, URL) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto(URL, { waitUntil: 'networkidle' });

  // 1. Initial Scale: 5
  let count = await page.locator('.status-badge').count();
  assert(count === 5, `scale 5 renders exactly 5 badges (actual: ${count})`);
  let opCount = await page.locator('#operation-count').innerText();
  assert(opCount === '1', `initial operation count is 1 (actual: ${opCount})`);

  // Verify all states present at scale 5
  const pendingCount = await page.locator('.status-badge[data-status="pending"]').count();
  const successCount = await page.locator('.status-badge[data-status="success"]').count();
  const errorCount   = await page.locator('.status-badge[data-status="error"]').count();
  const unknownCount = await page.locator('.status-badge[data-status="unknown"]').count();
  const customFallbackCount = await page.locator('.status-badge[data-status="invalid-custom"]').count();

  assert(pendingCount === 1, 'contains pending badge');
  assert(successCount === 1, 'contains success badge');
  assert(errorCount === 1, 'contains error badge');
  assert(unknownCount === 1, 'contains unknown badge');
  assert(customFallbackCount === 1, 'contains custom fallback badge');

  // Verify fallback text on unknown/custom badge
  const customText = await page.locator('.status-badge[data-status="invalid-custom"]').innerText();
  assert(customText.includes('invalid-custom'), 'unknown status receives fallback treatment with rendered text');

  // 2. Scale: 20
  await page.click('#scale-20');
  count = await page.locator('.status-badge').count();
  assert(count === 20, `scale 20 renders exactly 20 badges (actual: ${count})`);
  opCount = await page.locator('#operation-count').innerText();
  assert(opCount === '2', `operation count is 2 after scaling to 20 (actual: ${opCount})`);

  // 3. Scale: 50
  await page.click('#scale-50');
  count = await page.locator('.status-badge').count();
  assert(count === 50, `scale 50 renders exactly 50 badges (actual: ${count})`);
  opCount = await page.locator('#operation-count').innerText();
  assert(opCount === '3', `operation count is 3 after scaling to 50 (actual: ${opCount})`);

  // Check error logs
  assert(consoleErrors.length === 0, `zero console errors (got ${consoleErrors.length})`);
  assert(pageErrors.length === 0, `zero unhandled page errors (got ${pageErrors.length})`);

  return { consoleErrors: consoleErrors.length, pageErrors: pageErrors.length };
}

(async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
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
  } else {
    console.log('\n✅ All assertions passed. Exit 0.');
    process.exit(0);
  }
})();
