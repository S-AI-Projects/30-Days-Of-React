import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Applied Lab R19-T002: Ref Focus Management</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
</head>
<body style="font-family: system-ui, sans-serif; background: #f9f9f9; padding: 24px;">
  <div id="root"></div>
  <script>
    const { useState, useRef, useEffect, createElement: h } = React;

    function FocusDialog({ onSave }) {
      const [isOpen, setIsOpen] = useState(false);
      const [errorMessage, setErrorMessage] = useState('');
      const [lastSubmitted, setLastSubmitted] = useState('');

      const triggerRef = useRef(null);
      const inputRef = useRef(null);
      const renderCountRef = useRef(0);
      renderCountRef.current += 1;

      useEffect(() => {
        if (isOpen) {
          inputRef.current?.focus();
        }
      }, [isOpen]);

      const handleOpen = () => {
        setErrorMessage('');
        setIsOpen(true);
      };

      const handleClose = () => {
        setIsOpen(false);
        setErrorMessage('');
        setTimeout(() => {
          triggerRef.current?.focus();
        }, 0);
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        const rawValue = inputRef.current ? inputRef.current.value : '';
        const trimmed = rawValue.trim();

        if (!trimmed) {
          setErrorMessage('Input cannot be empty. Please provide valid text.');
          inputRef.current?.focus();
          return;
        }

        setLastSubmitted(trimmed);
        setErrorMessage('');
        setIsOpen(false);
        if (onSave) onSave(trimmed);
        setTimeout(() => {
          triggerRef.current?.focus();
        }, 0);
      };

      return h('div', { style: { maxWidth: '520px', margin: '20px auto' } },
        h('h2', null, 'Ref Focus Management Lab (R19-T002)'),
        h('p', null,
          'Render count: ',
          h('strong', { 'data-testid': 'render-count' }, renderCountRef.current)
        ),
        h('button', {
          type: 'button',
          ref: triggerRef,
          'data-testid': 'trigger-btn',
          onClick: handleOpen,
          style: { padding: '8px 16px', cursor: 'pointer' }
        }, 'Open Dialog'),
        lastSubmitted ? h('p', null,
          'Last submitted: ',
          h('span', { 'data-testid': 'last-submitted' }, lastSubmitted)
        ) : null,
        isOpen ? h('div', {
          role: 'dialog',
          'aria-modal': 'true',
          'data-testid': 'dialog-panel',
          style: {
            marginTop: '16px',
            padding: '20px',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: '#fff'
          }
        },
          h('h3', null, 'Enter Feedback'),
          h('form', { onSubmit: handleSubmit },
            h('div', { style: { marginBottom: '12px' } },
              h('label', {
                htmlFor: 'feedback-input',
                style: { display: 'block', marginBottom: '6px', fontWeight: 600 }
              }, 'Feedback Note:'),
              h('input', {
                id: 'feedback-input',
                ref: inputRef,
                'data-testid': 'dialog-input',
                type: 'text',
                defaultValue: '',
                placeholder: 'Type your feedback...',
                style: { width: '100%', padding: '8px', boxSizing: 'border-box' }
              })
            ),
            errorMessage ? h('p', {
              'data-testid': 'error-message',
              style: { color: '#d32f2f', margin: '4px 0 12px 0' }
            }, errorMessage) : null,
            h('div', { style: { display: 'flex', gap: '8px' } },
              h('button', {
                type: 'submit',
                'data-testid': 'submit-btn',
                style: { padding: '6px 14px', cursor: 'pointer' }
              }, 'Submit'),
              h('button', {
                type: 'button',
                'data-testid': 'close-btn',
                onClick: handleClose,
                style: { padding: '6px 14px', cursor: 'pointer' }
              }, 'Close')
            )
          )
        ) : null
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(h(FocusDialog));
  </script>
</body>
</html>`

async function runCheck() {
  console.log('--- Running Playwright Check for R19-T002 (Ref Focus & Boundary) ---')

  // Ensure work output directory exists
  const workDir = path.resolve('work/R19-T002')
  fs.mkdirSync(workDir, { recursive: true })

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
    await page.waitForSelector('[data-testid="trigger-btn"]')

    // 4. Initial state: dialog is closed
    const initialDialogCount = await page.locator('[data-testid="dialog-panel"]').count()
    if (initialDialogCount !== 0) {
      throw new Error('Dialog panel should not be visible initially')
    }
    console.log('[PASS] Initial state verified: dialog panel is closed')

    // 5. Open dialog and assert focus moves to input
    await page.click('[data-testid="trigger-btn"]')
    await page.waitForSelector('[data-testid="dialog-panel"]')

    const isInputFocused = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="dialog-input"]')
      return document.activeElement === input
    })
    if (!isInputFocused) {
      throw new Error('Focus failed to move to dialog input upon opening')
    }
    console.log('[PASS] Opening dialog moved focus to labelled input')

    // 6. Test zero re-renders during typing
    const renderCountBefore = await page.locator('[data-testid="render-count"]').textContent()
    await page.fill('[data-testid="dialog-input"]', 'Testing typing')
    const renderCountAfter = await page.locator('[data-testid="render-count"]').textContent()

    if (renderCountBefore !== renderCountAfter) {
      throw new Error(`Typing caused unexpected re-render: before=${renderCountBefore}, after=${renderCountAfter}`)
    }
    console.log(`[PASS] Typing caused zero re-renders (render count remained ${renderCountBefore})`)

    // 7. Test boundary: empty input submission
    await page.fill('[data-testid="dialog-input"]', '')
    await page.click('[data-testid="submit-btn"]')

    const errorMsg = page.locator('[data-testid="error-message"]')
    const errorText = await errorMsg.textContent()
    if (!errorText.includes('Input cannot be empty')) {
      throw new Error('Empty submission failed to trigger boundary validation error')
    }

    // Assert focus remains on input after rejected submission
    const isInputStillFocused = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="dialog-input"]')
      return document.activeElement === input
    })
    if (!isInputStillFocused) {
      throw new Error('Focus was lost from input after boundary validation failure')
    }

    // Assert dialog remains open
    const isDialogStillOpen = await page.locator('[data-testid="dialog-panel"]').isVisible()
    if (!isDialogStillOpen) {
      throw new Error('Dialog should remain open when boundary validation fails')
    }
    console.log('[PASS] Boundary condition verified: empty input rejected, error displayed, focus retained on input')

    // 8. Test whitespace-only boundary
    await page.fill('[data-testid="dialog-input"]', '     ')
    await page.click('[data-testid="submit-btn"]')
    if (!(await errorMsg.isVisible())) {
      throw new Error('Whitespace-only submission failed to trigger boundary validation error')
    }
    console.log('[PASS] Whitespace-only input boundary verified')

    // 9. Capture screenshot with active dialog and boundary error for evidence
    await page.screenshot({ path: path.join(workDir, 'screenshot.png'), fullPage: true })
    console.log('[PASS] UI screenshot captured at work/R19-T002/screenshot.png')

    // 10. Close dialog and assert focus restores to trigger
    await page.click('[data-testid="close-btn"]')
    await page.waitForSelector('[data-testid="dialog-panel"]', { state: 'detached' })

    // Wait for focus restoration tick
    await page.waitForTimeout(50)
    const isTriggerFocusedOnClose = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="trigger-btn"]')
      return document.activeElement === trigger
    })
    if (!isTriggerFocusedOnClose) {
      throw new Error('Closing dialog failed to restore focus to trigger button')
    }
    console.log('[PASS] Closing dialog restored focus to trigger button')

    // 11. Reopen, enter valid input, and submit
    await page.click('[data-testid="trigger-btn"]')
    await page.waitForSelector('[data-testid="dialog-panel"]')
    await page.fill('[data-testid="dialog-input"]', 'Valid submission text')
    await page.click('[data-testid="submit-btn"]')

    await page.waitForSelector('[data-testid="dialog-panel"]', { state: 'detached' })
    const lastSubmittedText = await page.locator('[data-testid="last-submitted"]').textContent()
    if (lastSubmittedText !== 'Valid submission text') {
      throw new Error('Valid submission text was not persisted')
    }

    // Wait for focus restoration tick after submit
    await page.waitForTimeout(50)
    const isTriggerFocusedAfterSubmit = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="trigger-btn"]')
      return document.activeElement === trigger
    })
    if (!isTriggerFocusedAfterSubmit) {
      throw new Error('Submitting dialog failed to restore focus to trigger button')
    }
    console.log('[PASS] Valid submission closed dialog, recorded value, and restored focus to trigger')

    // 12. Check for console errors or uncaught page exceptions
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
