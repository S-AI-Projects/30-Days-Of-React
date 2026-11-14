import http from 'node:http'
import { chromium } from 'playwright'

/**
 * HTML shell mounting the useToggle applied lab application.
 */
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Applied Lab R19-T001: useToggle</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
</head>
<body style="font-family: system-ui, sans-serif; background: #f9f9f9; padding: 24px;">
  <div id="root"></div>
  <script>
    const { useState, useCallback, createElement: h } = React;

    function useToggle(initialValue = false) {
      const [value, setValue] = useState(Boolean(initialValue));

      const toggle = useCallback(() => {
        setValue((prev) => !prev);
      }, []);

      const setTrue = useCallback(() => {
        setValue(true);
      }, []);

      const setFalse = useCallback(() => {
        setValue(false);
      }, []);

      const set = useCallback((nextValue) => {
        setValue(Boolean(nextValue));
      }, []);

      const reset = useCallback(() => {
        setValue(Boolean(initialValue));
      }, [initialValue]);

      const tuple = [value, toggle, set, reset];
      tuple.value = value;
      tuple.toggle = toggle;
      tuple.setTrue = setTrue;
      tuple.setFalse = setFalse;
      tuple.set = set;
      tuple.reset = reset;
      return tuple;
    }

    function TogglePanel({ id, title, initialValue = false }) {
      const [isOn, toggle, set, reset] = useToggle(initialValue);

      return h('div', {
        className: 'panel',
        'data-testid': 'panel-' + id,
        id: 'panel-' + id,
        style: {
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px',
          margin: '12px 0',
          backgroundColor: '#fff'
        }
      },
        h('h3', null, title),
        h('p', null,
          'Status: ',
          h('strong', {
            'data-testid': 'status-' + id,
            style: { color: isOn ? '#2e7d32' : '#c62828' }
          }, isOn ? 'ON' : 'OFF')
        ),
        h('div', { style: { display: 'flex', gap: '8px' } },
          h('button', {
            type: 'button',
            'data-testid': 'btn-toggle-' + id,
            onClick: toggle
          }, 'Toggle'),
          h('button', {
            type: 'button',
            'data-testid': 'btn-set-true-' + id,
            onClick: () => set(true)
          }, 'Set True'),
          h('button', {
            type: 'button',
            'data-testid': 'btn-set-false-' + id,
            onClick: () => set(false)
          }, 'Set False'),
          h('button', {
            type: 'button',
            'data-testid': 'btn-reset-' + id,
            onClick: reset
          }, 'Reset')
        )
      );
    }

    function App() {
      return h('main', { style: { maxWidth: '500px', margin: '0 auto' } },
        h('h1', null, 'useToggle Lab'),
        h(TogglePanel, { id: 'a', title: 'Panel A', initialValue: false }),
        h(TogglePanel, { id: 'b', title: 'Panel B', initialValue: false })
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(h(App));
  </script>
</body>
</html>`

async function runCheck() {
  console.log('--- Running Playwright Check for R19-T001 (useToggle) ---')

  // 1. Start local server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(HTML_CONTENT)
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  const url = `http://127.0.0.1:${port}`
  console.log(`[PASS] Ephemeral local test server listening on ${url}`)

  const consoleErrors = []
  const pageErrors = []

  // 2. Launch browser
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    pageErrors.push(err.message)
  })

  try {
    // 3. Navigate to test page
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="status-a"]')

    // 4. Assert initial states
    const statusA = page.locator('[data-testid="status-a"]')
    const statusB = page.locator('[data-testid="status-b"]')

    if ((await statusA.textContent()) !== 'OFF') {
      throw new Error('Initial status for Panel A should be OFF')
    }
    if ((await statusB.textContent()) !== 'OFF') {
      throw new Error('Initial status for Panel B should be OFF')
    }
    console.log('[PASS] Initial states verified: Panel A = OFF, Panel B = OFF')

    // 5. Toggle Panel A -> Panel A ON, Panel B stays OFF
    await page.click('[data-testid="btn-toggle-a"]')
    if ((await statusA.textContent()) !== 'ON') {
      throw new Error('Panel A failed to toggle to ON')
    }
    if ((await statusB.textContent()) !== 'OFF') {
      throw new Error('Panel B was unexpectedly modified when toggling Panel A')
    }
    console.log('[PASS] Panel A toggled to ON; Panel B remains OFF (isolation confirmed)')

    // 6. Toggle Panel B -> Panel B ON, Panel A stays ON
    await page.click('[data-testid="btn-toggle-b"]')
    if ((await statusB.textContent()) !== 'ON') {
      throw new Error('Panel B failed to toggle to ON')
    }
    if ((await statusA.textContent()) !== 'ON') {
      throw new Error('Panel A was unexpectedly modified when toggling Panel B')
    }
    console.log('[PASS] Panel B toggled to ON; Panel A remains ON')

    // 7. Explicit Set False on Panel A
    await page.click('[data-testid="btn-set-false-a"]')
    if ((await statusA.textContent()) !== 'OFF') {
      throw new Error('Panel A failed to setFalse')
    }
    if ((await statusB.textContent()) !== 'ON') {
      throw new Error('Panel B state corrupted by Panel A setFalse')
    }
    console.log('[PASS] Panel A explicit setFalse verified; Panel B unchanged')

    // 8. Explicit Set True on Panel A
    await page.click('[data-testid="btn-set-true-a"]')
    if ((await statusA.textContent()) !== 'ON') {
      throw new Error('Panel A failed to setTrue')
    }
    console.log('[PASS] Panel A explicit setTrue verified')

    // 9. Reset Panel A
    await page.click('[data-testid="btn-reset-a"]')
    if ((await statusA.textContent()) !== 'OFF') {
      throw new Error('Panel A failed to reset to initial value (OFF)')
    }
    console.log('[PASS] Panel A reset verified')

    // 10. Capture screenshot of verified UI for PR submission
    await page.screenshot({ path: 'work/R19-T001/screenshot.png', fullPage: true })
    console.log('[PASS] UI screenshot captured at work/R19-T001/screenshot.png')

    // 11. Check for console errors or uncaught exceptions
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`)
    }
    if (pageErrors.length > 0) {
      throw new Error(`Page errors detected: ${JSON.stringify(pageErrors)}`)
    }
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

