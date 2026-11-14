/**
 * check.mjs — R19-T010 Automated Playwright Verification
 *
 * Verifies lifecycle cleanup:
 * 1. Out-of-order responses do not overwrite newer state.
 * 2. Unmounting with in-flight requests causes zero errors.
 * 3. Regression test fails on a 1-line mutant (omitting isSubscribed guard).
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

const SCREENSHOT_PATH = path.resolve(__dirname, '../../../work/R19-T010/screenshot.png');

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>R19-T010 Lifecycle Request Cleanup Lab</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</head>
<body>
<div id="root"></div>
<script>
  const { useState, useEffect, createElement: h } = React;

  function fetchUserData(query) {
    const delays = { alpha: 220, beta: 40 };
    const delay = delays[query] || 80;
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          query: query,
          result: 'Profile data for ' + query.toUpperCase()
        });
      }, delay);
    });
  }

  function UserProfileFetcher({ query, mutateIgnoreCleanup }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let isSubscribed = true;
      setLoading(true);

      fetchUserData(query).then(response => {
        // DECISIVE GUARD: if mutated, ignore cancellation
        if (!mutateIgnoreCleanup && !isSubscribed) {
          return;
        }
        setData(response);
        setLoading(false);
      });

      return () => {
        isSubscribed = false;
      };
    }, [query, mutateIgnoreCleanup]);

    return h('div', { id: 'profile-display' },
      h('p', { id: 'loading-indicator' }, loading ? 'Loading...' : 'Idle'),
      h('p', { id: 'active-query' }, 'Query: ' + query),
      h('p', { id: 'resolved-result' }, 'Result: ' + (data ? data.result : 'None'))
    );
  }

  function LifecycleCleanupLab() {
    const [query, setQuery] = useState('alpha');
    const [isMounted, setIsMounted] = useState(true);
    const [mutantMode, setMutantMode] = useState(false);

    return h('div', { style: { fontFamily: 'sans-serif', padding: '2rem' } },
      h('h2', null, 'Day 13: Lifecycle Request Cleanup Lab'),
      h('div', { style: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' } },
        h('button', { id: 'btn-alpha', type: 'button', onClick: () => setQuery('alpha') }, 'Query alpha'),
        h('button', { id: 'btn-beta', type: 'button', onClick: () => setQuery('beta') }, 'Query beta'),
        h('button', { id: 'btn-toggle-mount', type: 'button', onClick: () => setIsMounted(m => !m) },
          isMounted ? 'Unmount Fetcher' : 'Mount Fetcher'
        ),
        h('button', { id: 'btn-enable-mutant', type: 'button', onClick: () => setMutantMode(true) }, 'Enable Mutant')
      ),
      h('div', { id: 'container' },
        isMounted ? h(UserProfileFetcher, { query: query, mutateIgnoreCleanup: mutantMode }) : h('p', { id: 'unmounted-msg' }, 'Fetcher is unmounted.')
      )
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(h(LifecycleCleanupLab));
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

  // 1. Initial load (alpha) completes
  await page.waitForSelector('#resolved-result:has-text("Profile data for ALPHA")');
  let resultText = await page.locator('#resolved-result').innerText();
  assert(resultText.includes('ALPHA'), `initial load resolves to ALPHA (actual: ${resultText})`);

  // 2. Race condition test: trigger slow alpha, immediately trigger fast beta
  await page.click('#btn-alpha'); // takes 220ms
  await page.waitForTimeout(20);
  await page.click('#btn-beta');  // takes 40ms, resolves first

  // Wait for fast response
  await page.waitForSelector('#resolved-result:has-text("Profile data for BETA")');
  resultText = await page.locator('#resolved-result').innerText();
  assert(resultText.includes('BETA'), 'fast request BETA resolves quickly');

  // Wait long enough for slow alpha to resolve in background (takes ~220ms total)
  await page.waitForTimeout(300);

  // Assert decisive condition: BETA was NOT overwritten by stale slow ALPHA
  resultText = await page.locator('#resolved-result').innerText();
  assert(resultText.includes('BETA'), `cleanup prevented stale ALPHA from overwriting BETA (actual: ${resultText})`);

  // 3. Unmount test with in-flight request
  await page.click('#btn-alpha');
  await page.waitForTimeout(20);
  await page.click('#btn-toggle-mount'); // Unmount fetcher while alpha is pending

  const unmountedMsg = await page.locator('#unmounted-msg').innerText();
  assert(unmountedMsg.includes('unmounted'), 'component successfully unmounted');

  // Wait for the in-flight alpha to complete while component is unmounted
  await page.waitForTimeout(300);
  assert(consoleErrors.length === 0, `zero console errors after unmount (got ${consoleErrors.length})`);
  assert(pageErrors.length === 0, `zero unhandled page errors after unmount (got ${pageErrors.length})`);

  // 4. Mutant sensitivity test: verify that without the cleanup guard, the bug DOES occur
  await page.click('#btn-toggle-mount'); // re-mount
  await page.click('#btn-enable-mutant'); // enable mutant (bypasses cleanup check)
  await page.waitForSelector('#resolved-result');

  await page.click('#btn-alpha'); // slow (220ms)
  await page.waitForTimeout(20);
  await page.click('#btn-beta');  // fast (40ms)
  await page.waitForSelector('#resolved-result:has-text("Profile data for BETA")');

  // Wait for slow alpha to resolve without cleanup guard
  await page.waitForTimeout(300);
  const mutantResult = await page.locator('#resolved-result').innerText();
  const mutantFailedInvariant = mutantResult.includes('ALPHA');
  assert(mutantFailedInvariant, `mutant confirmed: omitting cleanup guard allows stale ALPHA to overwrite newer BETA (result: ${mutantResult})`);

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
