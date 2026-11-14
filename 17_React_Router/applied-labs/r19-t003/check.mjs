import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROUTE_REFERENCE_TABLE = [
  {
    path: '/',
    view: 'home',
    heading: 'Course Topics',
    content: 'Select a course topic to view details.',
  },
  {
    path: '/item/1',
    view: 'detail',
    heading: 'React Basics',
    content: 'Core components and props fundamentals.',
  },
  {
    path: '/item/2',
    view: 'detail',
    heading: 'State Management',
    content: 'Interactive hooks and state updates.',
  },
  {
    path: '/item/3',
    view: 'detail',
    heading: 'Routing Patterns',
    content: 'Declarative routing and navigation history.',
  },
  {
    path: '/item/999',
    view: 'not-found',
    heading: 'Not Found',
    content: 'Topic with ID "999" was not found.',
  },
  {
    path: '/unknown',
    view: 'not-found',
    heading: 'Not Found',
    content: 'The requested route does not exist.',
  },
]

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Applied Lab R19-T003: React Router</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
</head>
<body style="font-family: system-ui, sans-serif; background: #f9f9f9; padding: 24px;">
  <div id="root"></div>
  <script>
    const { useState, useEffect, createElement: h } = React;

    const ITEMS = [
      { id: '1', title: 'React Basics', description: 'Core components and props fundamentals.' },
      { id: '2', title: 'State Management', description: 'Interactive hooks and state updates.' },
      { id: '3', title: 'Routing Patterns', description: 'Declarative routing and navigation history.' }
    ];

    function Link({ to, children, ...props }) {
      const handleClick = (e) => {
        e.preventDefault();
        if (window.location.pathname !== to) {
          window.history.pushState({}, '', to);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      };
      return h('a', { href: to, onClick: handleClick, ...props }, children);
    }

    function App() {
      const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

      useEffect(() => {
        const onPopState = () => setCurrentPath(window.location.pathname);
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
      }, []);

      let view = 'home';
      let activeItem = null;
      let requestedId = null;

      if (currentPath === '/' || currentPath === '') {
        view = 'home';
      } else if (currentPath.startsWith('/item/')) {
        requestedId = currentPath.replace('/item/', '');
        activeItem = ITEMS.find(i => i.id === requestedId);
        view = activeItem ? 'detail' : 'not-found';
      } else {
        view = 'not-found';
      }

      return h('div', { style: { maxWidth: '600px', margin: '20px auto' } },
        h('header', null,
          h('h1', null, 'React Router Lab (R19-T003)'),
          h('nav', { 'aria-label': 'Main Navigation', style: { display: 'flex', gap: '16px', marginBottom: '20px' } },
            h(Link, { to: '/', 'data-testid': 'nav-home' }, 'Home'),
            h(Link, { to: '/item/1', 'data-testid': 'nav-item-1' }, 'Topic 1'),
            h(Link, { to: '/item/2', 'data-testid': 'nav-item-2' }, 'Topic 2'),
            h(Link, { to: '/item/999', 'data-testid': 'nav-unknown' }, 'Unknown ID')
          )
        ),
        h('main', { 'data-testid': 'route-container', style: { padding: '16px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' } },
          view === 'home' ? h('section', { 'data-testid': 'view-home' },
            h('h2', { 'data-testid': 'view-title' }, 'Course Topics'),
            h('p', { 'data-testid': 'view-description' }, 'Select a course topic to view details.'),
            h('ul', null,
              ITEMS.map(item => h('li', { key: item.id },
                h(Link, { to: '/item/' + item.id, 'data-testid': 'item-link-' + item.id }, item.title)
              ))
            )
          ) : null,
          view === 'detail' && activeItem ? h('section', { 'data-testid': 'view-detail' },
            h('h2', { 'data-testid': 'view-title' }, activeItem.title),
            h('p', { 'data-testid': 'view-description' }, activeItem.description),
            h('p', null, h('small', null, 'Topic ID: ', h('code', { 'data-testid': 'item-id' }, activeItem.id))),
            h(Link, { to: '/', 'data-testid': 'back-to-home' }, '← Back to Topics')
          ) : null,
          view === 'not-found' ? h('section', { 'data-testid': 'view-not-found' },
            h('h2', { 'data-testid': 'view-title', style: { color: '#d32f2f' } }, 'Not Found'),
            h('p', { 'data-testid': 'view-description' },
              requestedId ? ('Topic with ID "' + requestedId + '" was not found.') : 'The requested route does not exist.'
            ),
            h(Link, { to: '/', 'data-testid': 'not-found-home-link' }, 'Return to Home')
          ) : null
        )
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(h(App));
  </script>
</body>
</html>`

async function runCheck() {
  console.log('--- Running Playwright Check for R19-T003 (Route Behavior & Reference Comparison) ---')

  const workDir = path.resolve('work/R19-T003')
  fs.mkdirSync(workDir, { recursive: true })

  // 1. SPA fallback HTTP server
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

  // 2. Launch browser
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  try {
    // 3. Test Home View against reference table
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="view-home"]')

    const refHome = ROUTE_REFERENCE_TABLE.find((r) => r.path === '/')
    const homeTitle = await page.locator('[data-testid="view-title"]').textContent()
    const homeDesc = await page.locator('[data-testid="view-description"]').textContent()

    if (homeTitle !== refHome.heading) {
      throw new Error(`Home title mismatch: expected "${refHome.heading}", got "${homeTitle}"`)
    }
    if (homeDesc !== refHome.content) {
      throw new Error(`Home content mismatch: expected "${refHome.content}", got "${homeDesc}"`)
    }
    console.log('[PASS] Home route (/) matches reference table expectation')

    // 4. Test Known ID Navigation (/item/1)
    await page.click('[data-testid="item-link-1"]')
    await page.waitForSelector('[data-testid="view-detail"]')

    const refItem1 = ROUTE_REFERENCE_TABLE.find((r) => r.path === '/item/1')
    const item1Title = await page.locator('[data-testid="view-title"]').textContent()
    const item1Desc = await page.locator('[data-testid="view-description"]').textContent()

    if (item1Title !== refItem1.heading || item1Desc !== refItem1.content) {
      throw new Error(`Detail route /item/1 mismatch against reference table`)
    }
    console.log('[PASS] Known ID route (/item/1) displays detail view matching reference table')

    // 5. Test Browser Back Navigation
    await page.goBack()
    await page.waitForSelector('[data-testid="view-home"]')
    const restoredTitle = await page.locator('[data-testid="view-title"]').textContent()
    if (restoredTitle !== refHome.heading) {
      throw new Error('Browser Back failed to restore prior Home view')
    }
    console.log('[PASS] Browser Back restores prior view (Home) successfully')

    // 6. Test Unknown ID Navigation (/item/999)
    await page.click('[data-testid="nav-unknown"]')
    await page.waitForSelector('[data-testid="view-not-found"]')

    const refUnknown = ROUTE_REFERENCE_TABLE.find((r) => r.path === '/item/999')
    const unknownTitle = await page.locator('[data-testid="view-title"]').textContent()
    const unknownDesc = await page.locator('[data-testid="view-description"]').textContent()

    if (unknownTitle !== refUnknown.heading || unknownDesc !== refUnknown.content) {
      throw new Error(`Unknown ID route mismatch against reference table`)
    }
    console.log('[PASS] Unknown ID route (/item/999) displays Not Found matching reference table')

    // 7. Test Direct Unknown Route Navigation (/unknown)
    await page.goto(`${baseUrl}/unknown`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="view-not-found"]')

    const refUnknownPath = ROUTE_REFERENCE_TABLE.find((r) => r.path === '/unknown')
    const unkPathTitle = await page.locator('[data-testid="view-title"]').textContent()
    const unkPathDesc = await page.locator('[data-testid="view-description"]').textContent()

    if (unkPathTitle !== refUnknownPath.heading || unkPathDesc !== refUnknownPath.content) {
      throw new Error(`Arbitrary unknown path mismatch against reference table`)
    }
    console.log('[PASS] Arbitrary unknown route (/unknown) displays Not Found matching reference table')

    // 8. Capture UI screenshot
    await page.screenshot({ path: path.join(workDir, 'screenshot.png'), fullPage: true })
    console.log('[PASS] UI screenshot captured at work/R19-T003/screenshot.png')

    // 9. Verify zero console/page errors
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
