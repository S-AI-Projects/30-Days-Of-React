import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Applied Lab R19-T004: Cancellable Fetch Hook</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
</head>
<body style="font-family: system-ui, sans-serif; background: #f9f9f9; padding: 24px;">
  <div id="root"></div>
  <script>
    const { useState, useEffect, useRef, createElement: h } = React;

    const defaultFetcher = (key) => {
      return new Promise((resolve, reject) => {
        const latencies = { A: 300, B: 50, C: 60 };
        const delay = latencies[key] !== undefined ? latencies[key] : 100;
        setTimeout(() => {
          if (key === 'C') {
            reject(new Error('Network error: failed to fetch key C'));
          } else {
            resolve({ key, payload: 'Resolved payload for ' + key, timestamp: Date.now() });
          }
        }, delay);
      });
    };

    function useCancellableFetch(key, fetcher = defaultFetcher) {
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(Boolean(key));
      const [error, setError] = useState(null);
      const [prevKey, setPrevKey] = useState(key);
      const activeKeyRef = useRef(key);

      if (key !== prevKey) {
        setPrevKey(key);
        setLoading(Boolean(key));
        setError(null);
        setData(null);
      }

      useEffect(() => {
        activeKeyRef.current = key;
        if (!key) return;

        let isSubscribed = true;

        fetcher(key)
          .then((res) => {
            if (isSubscribed && activeKeyRef.current === key) {
              setData(res);
              setLoading(false);
              setError(null);
            }
          })
          .catch((err) => {
            if (isSubscribed && activeKeyRef.current === key) {
              setError(err.message || 'Error occurred');
              setLoading(false);
              setData(null);
            }
          });

        return () => {
          isSubscribed = false;
        };
      }, [key, fetcher]);

      return { data, loading, error, activeKey: activeKeyRef.current };
    }

    function CancellableFetchDemo({ fetcher = defaultFetcher }) {
      const [selectedKey, setSelectedKey] = useState('A');
      const { data, loading, error } = useCancellableFetch(selectedKey, fetcher);

      return h('div', { style: { maxWidth: '560px', margin: '20px auto' } },
        h('h2', null, 'Cancellable Fetch Hook Lab (R19-T004)'),
        h('p', null, 'Exercises cancellation and stale-response rejection when rapidly switching query keys.'),
        h('div', { style: { display: 'flex', gap: '8px', marginBottom: '16px' } },
          h('button', {
            type: 'button',
            'data-testid': 'btn-key-a',
            onClick: () => setSelectedKey('A')
          }, 'Select Key A (Slow 300ms)'),
          h('button', {
            type: 'button',
            'data-testid': 'btn-key-b',
            onClick: () => setSelectedKey('B')
          }, 'Select Key B (Fast 50ms)'),
          h('button', {
            type: 'button',
            'data-testid': 'btn-key-c',
            onClick: () => setSelectedKey('C')
          }, 'Select Key C (Error 60ms)')
        ),
        h('div', {
          'data-testid': 'status-panel',
          style: { padding: '16px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }
        },
          h('p', null, 'Active Key: ', h('strong', { 'data-testid': 'active-key' }, selectedKey)),
          loading ? h('p', { 'data-testid': 'loading-state', style: { color: '#1976d2' } },
            'Loading data for key ' + selectedKey + '...'
          ) : null,
          error ? h('p', { 'data-testid': 'error-state', style: { color: '#d32f2f' } },
            'Error: ' + error
          ) : null,
          data && !loading && !error ? h('div', { 'data-testid': 'data-container' },
            h('h4', { 'data-testid': 'data-key' }, data.key),
            h('p', { 'data-testid': 'data-payload' }, data.payload)
          ) : null
        )
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(h(CancellableFetchDemo));
  </script>
</body>
</html>`

async function runCheck() {
  console.log('--- Running Playwright Check for R19-T004 (Fetch Cancellation & Invariant) ---')

  const workDir = path.resolve('work/R19-T004')
  fs.mkdirSync(workDir, { recursive: true })

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(HTML_CONTENT)
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`
  console.log(`[PASS] Ephemeral local test server listening on ${baseUrl}`)

  const consoleErrors = []
  const pageErrors = []

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  try {
    // 1. Initial Load of Key A (300ms)
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    const initialLoading = await page.locator('[data-testid="loading-state"]').isVisible()
    if (!initialLoading) throw new Error('Initial loading state not visible')

    await page.waitForSelector('[data-testid="data-container"]')
    const dataKeyA = await page.locator('[data-testid="data-key"]').textContent()
    if (dataKeyA !== 'A') throw new Error(`Initial data key mismatch: expected "A", got "${dataKeyA}"`)
    console.log('[PASS] Initial load for Key A resolved correctly')

    // 2. Select Error Key C (60ms) and assert error display
    await page.click('[data-testid="btn-key-c"]')
    await page.waitForSelector('[data-testid="error-state"]')
    const errorText = await page.locator('[data-testid="error-state"]').textContent()
    if (!errorText.includes('Network error: failed to fetch key C')) {
      throw new Error('Error state text mismatch for key C')
    }
    console.log('[PASS] Key C error state properly captured and rendered')

    // 3. Reset invariant: switching from error key C to fast key B resets error immediately
    await page.click('[data-testid="btn-key-b"]')
    const isErrorGone = (await page.locator('[data-testid="error-state"]').count()) === 0
    if (!isErrorGone) throw new Error('Error state did not immediately clear when switching keys')
    const isLoadingVisible = await page.locator('[data-testid="loading-state"]').isVisible()
    if (!isLoadingVisible) throw new Error('Loading state did not activate when switching to key B')
    console.log('[PASS] Reset invariant verified: error cleared and loading reactivated on key change')

    // Wait for B to resolve
    await page.waitForSelector('[data-testid="data-container"]')
    const dataKeyB = await page.locator('[data-testid="data-key"]').textContent()
    if (dataKeyB !== 'B') throw new Error(`Expected key B resolution, got "${dataKeyB}"`)
    console.log('[PASS] Key B resolved data cleanly')

    // 4. Stale-Response Cancellation Race Condition Invariant
    // Trigger slow request A (300ms), then quickly switch to fast request B (50ms)
    console.log('[INFO] Triggering race condition: Slow Key A immediately followed by Fast Key B')
    await page.click('[data-testid="btn-key-a"]')
    await page.waitForTimeout(30) // Request A is in-flight
    await page.click('[data-testid="btn-key-b"]') // Request B supersedes A

    // Key B should resolve in ~50ms
    await page.waitForSelector('[data-testid="data-key"]')
    const immediateKey = await page.locator('[data-testid="data-key"]').textContent()
    if (immediateKey !== 'B') {
      throw new Error(`Expected fast Key B to render first, got "${immediateKey}"`)
    }
    console.log('[PASS] Fast Key B rendered data at ~50ms')

    // Now wait 350ms (well past Key A's 300ms resolution time)
    await page.waitForTimeout(350)

    // Key A must NOT have overwritten Key B!
    const keyAfterLateA = await page.locator('[data-testid="data-key"]').textContent()
    if (keyAfterLateA !== 'B') {
      throw new Error(`STALE RESPONSE LEAK: Late response for Key A overwrote active Key B! Got: "${keyAfterLateA}"`)
    }
    console.log('[PASS] Stale response invariant verified: Late response for Key A was safely discarded')

    // 5. Capture UI screenshot
    await page.screenshot({ path: path.join(workDir, 'screenshot.png'), fullPage: true })
    console.log('[PASS] UI screenshot captured at work/R19-T004/screenshot.png')

    // 6. Zero errors check
    if (consoleErrors.length > 0) throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`)
    if (pageErrors.length > 0) throw new Error(`Page errors detected: ${JSON.stringify(pageErrors)}`)
    console.log('[PASS] Zero console errors or unhandled page exceptions detected')

    console.log('✅ ALL CONTRACT ASSERTIONS PASSED')
  } finally {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }
}

runCheck().catch((err) => {
  console.error('❌ Check failed:', err)
  process.exit(1)
})
