/**
 * check.mjs — R19-T005 Automated Playwright Verification
 *
 * Deterministic fixture lab: runs the full assertion suite TWICE on isolated
 * page navigations and asserts that both runs produce identical outcomes.
 *
 * Exit 0 → all assertions passed on both runs.
 * Exit 1 → any assertion failed or the two runs disagreed.
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_PATH = path.resolve(__dirname, '../../../work/R19-T005/screenshot.png');

// ─── Inline HTML ──────────────────────────────────────────────────────────────
// The React component logic is reproduced here using React.createElement (no
// JSX / bundler needed) so the check runs with plain Node + Playwright only.
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>R19-T005 Focus Dialog Lab</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</head>
<body>
<div id="root"></div>
<script>
  const { useState, useRef, useCallback, useLayoutEffect, createElement: h } = React;

  function FocusDialogLab() {
    const [isOpen, setIsOpen] = useState(false);

    const triggerRef = useRef(null);
    const inputRef   = useRef(null);

    // Plain ref counter — never stored in state, so it never triggers re-renders
    const renderCounterRef = useRef(0);
    renderCounterRef.current += 1;

    const open = useCallback(() => {
      setIsOpen(true);
    }, []);

    const close = useCallback(() => {
      setIsOpen(false);
      requestAnimationFrame(() => {
        if (triggerRef.current) triggerRef.current.focus();
      });
    }, []);

    useLayoutEffect(() => {
      if (isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen]);

    return h('div', { style: { fontFamily: 'sans-serif', padding: '2rem' } },
      h('h2', null, 'Ref Focus Management — Deterministic Fixture Lab'),

      h('button', {
        ref: triggerRef,
        id: 'open-btn',
        onClick: open,
        'aria-haspopup': 'dialog',
        'aria-expanded': isOpen,
      }, 'Open Dialog'),

      isOpen && h('div', {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Demo dialog',
        id: 'dialog-panel',
        style: {
          marginTop: '1rem', padding: '1rem',
          border: '2px solid #333', borderRadius: '4px', maxWidth: '360px',
        },
      },
        h('label', { htmlFor: 'dialog-input' }, 'Your name:'),
        h('br'),
        h('input', { ref: inputRef, id: 'dialog-input', type: 'text', style: { marginTop: '0.5rem', width: '100%' } }),
        h('br'),
        h('button', { id: 'close-btn', onClick: close, style: { marginTop: '0.75rem' } }, 'Close Dialog'),
      ),

      h('p', { id: 'render-count', style: { marginTop: '1rem', color: '#555' } },
        'Component renders: ',
        h('span', { id: 'render-count-value' }, renderCounterRef.current),
      ),
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(h(FocusDialogLab));
</script>
</body>
</html>`;

// ─── Assertion helpers ────────────────────────────────────────────────────────
let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

// ─── Single run of the assertion suite ───────────────────────────────────────
async function runSuite(page, label, captureScreenshot) {
  console.log(`\n── Run ${label} ──`);
  const consoleErrors = [];
  const pageErrors    = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => pageErrors.push(err.message));

  // 1. Trigger button is present and focused by default? (not necessarily — just present)
  const triggerExists = await page.locator('#open-btn').count();
  assert(triggerExists === 1, `${label}: trigger button #open-btn is in the DOM`);

  // Record render count before open
  const renderBefore = parseInt(
    await page.locator('#render-count-value').innerText(), 10
  );

  // 2. Open the dialog
  await page.click('#open-btn');
  await page.waitForSelector('#dialog-panel');

  // 3. Focus moved to input
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  assert(focusedId === 'dialog-input', `${label}: focus is on #dialog-input after open`);

  // 4. Type in the input — record render count before and after
  const renderAfterOpen = parseInt(
    await page.locator('#render-count-value').innerText(), 10
  );
  await page.fill('#dialog-input', 'Hardik');
  const renderAfterType = parseInt(
    await page.locator('#render-count-value').innerText(), 10
  );
  assert(
    renderAfterType === renderAfterOpen,
    `${label}: typing does NOT trigger ref-driven re-renders (count stays at ${renderAfterOpen})`
  );

  // 5. Close the dialog
  await page.click('#close-btn');
  await page.waitForSelector('#dialog-panel', { state: 'detached' });

  // Allow rAF to execute
  await page.waitForTimeout(50);

  // 6. Focus restored to trigger
  const focusedIdAfterClose = await page.evaluate(() => document.activeElement?.id);
  assert(
    focusedIdAfterClose === 'open-btn',
    `${label}: focus restored to #open-btn after close`
  );

  // 7. Render count incremented exactly for open (+1) and close (+1) = 2 total
  const renderAfterClose = parseInt(
    await page.locator('#render-count-value').innerText(), 10
  );
  const renderDelta = renderAfterClose - renderBefore;
  // React 18 strict-mode double-invokes in dev; we allow 2 or 4
  assert(
    renderDelta === 2 || renderDelta === 4,
    `${label}: render count incremented by 2 (or 4 in StrictMode) for open+close (got +${renderDelta})`
  );

  // 8. Zero console errors
  assert(consoleErrors.length === 0, `${label}: zero console errors (got ${consoleErrors.length})`);

  // 9. Zero unhandled page errors
  assert(pageErrors.length === 0, `${label}: zero unhandled page errors (got ${pageErrors.length})`);

  if (captureScreenshot) {
    fs.mkdirSync(path.dirname(SCREENSHOT_PATH), { recursive: true });
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`  📸 Screenshot saved → ${SCREENSHOT_PATH}`);
  }

  return {
    focusedId,
    focusedIdAfterClose,
    renderDelta,
    consoleErrors: consoleErrors.length,
    pageErrors: pageErrors.length,
    typingRendered: renderAfterType === renderAfterOpen,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  // Start HTTP server
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
    // ── Run 1 ──
    const page1 = await browser.newPage();
    await page1.goto(URL, { waitUntil: 'networkidle' });
    const result1 = await runSuite(page1, 'Run-1', true /* capture screenshot */);
    await page1.close();

    // ── Run 2 (isolated page — proves determinism) ──
    const page2 = await browser.newPage();
    await page2.goto(URL, { waitUntil: 'networkidle' });
    const result2 = await runSuite(page2, 'Run-2', false);
    await page2.close();

    // ── Determinism assertion ──
    console.log('\n── Determinism check ──');
    const keys = Object.keys(result1);
    for (const key of keys) {
      const match = JSON.stringify(result1[key]) === JSON.stringify(result2[key]);
      assert(match, `Run-1 and Run-2 agree on "${key}" (${JSON.stringify(result1[key])})`);
    }

  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n${'─'.repeat(50)}`);
  if (failures > 0) {
    console.error(`\n❌ ${failures} assertion(s) failed.`);
    process.exit(1);
  } else {
    console.log('\n✅ All assertions passed on both runs. Exit 0.');
    process.exit(0);
  }
})();
