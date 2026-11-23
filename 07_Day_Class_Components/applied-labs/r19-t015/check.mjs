import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T015')
const errors = []

// Fixed fixture: the same steps and the same event names in every run.
// listeners = active listeners on the injected source; received = list shown (null = notifier unmounted).
const scenario = [
  { step: 'initial (mounted)', listeners: 1, received: [] },
  { step: 'emit event-1', emit: 'event-1', listeners: 1, received: ['event-1'] },
  { step: 'unmount', click: 'Unmount notifier', listeners: 0, received: null },
  { step: 'emit event-2 while unmounted', emit: 'event-2', listeners: 0, received: null },
  { step: 'remount', click: 'Mount notifier', listeners: 1, received: [] },
  { step: 'emit event-3 (must arrive once, not twice)', emit: 'event-3', listeners: 1, received: ['event-3'] },
  { step: 'unmount again', click: 'Unmount notifier', listeners: 0, received: null },
]
const results = { inputs: scenario.map((s) => s.emit ?? s.click ?? null), expected: scenario, runs: [] }

const server = await createServer({
  root: labDir,
  configFile: false,
  logLevel: 'silent',
  server: { host: '127.0.0.1' },
})
await server.listen()
const url = server.resolvedUrls.local[0]
const browser = await chromium.launch()

// One isolated run = a brand-new browser context and page.
async function runScenario() {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(url)

  const actual = []
  for (const row of scenario) {
    if (row.emit) await page.evaluate((p) => window.__source.emit(p), row.emit)
    if (row.click) await page.getByRole('button', { name: row.click, exact: true }).click()

    await expect
      .poll(() => page.evaluate(() => window.__source.listenerCount()), { message: row.step })
      .toBe(row.listeners)

    const items = page.getByTestId('received').locator('li')
    if (row.received === null) {
      await expect(page.getByTestId('received')).toHaveCount(0)
    } else {
      await expect.poll(() => items.allTextContents(), { message: row.step }).toEqual(row.received)
      await expect(page.getByTestId('count')).toHaveText(`Notifications: ${row.received.length}`)
    }

    actual.push({
      step: row.step,
      listeners: await page.evaluate(() => window.__source.listenerCount()),
      received: row.received === null ? null : await items.allTextContents(),
    })
  }
  await context.close()
  return actual
}

try {
  const run1 = await runScenario()
  const run2 = await runScenario()
  results.runs = [run1, run2]

  // Two isolated runs must give identical results.
  expect(run2).toEqual(run1)

  if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '))
  results.status = 'PASS'
  console.log('PASS: R19-T015 checks passed (two isolated runs identical)')
} catch (err) {
  results.status = 'FAIL'
  results.error = String(err)
  console.error('FAIL:', err)
  process.exitCode = 1
} finally {
  results.versions = { node: process.version, chromium: browser.version() }
  fs.mkdirSync(workDir, { recursive: true })
  fs.writeFileSync(path.join(workDir, 'results.json'), JSON.stringify(results, null, 2))
  await browser.close()
  await server.close()
}
