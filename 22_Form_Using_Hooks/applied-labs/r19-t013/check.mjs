import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T013')
const errors = []

// INDEPENDENT REFERENCE: expected-result table, written without using the component's code.
// counts = active listeners on channel A and B after the action; last = last message (null = subscriber unmounted).
const table = [
  { step: 'initial (subscribed to A)', action: null, counts: { A: 1, B: 0 }, last: 'none' },
  { step: 'publish to A', action: 'Publish to A', counts: { A: 1, B: 0 }, last: 'msg-A' },
  { step: 'publish to B (not subscribed)', action: 'Publish to B', counts: { A: 1, B: 0 }, last: 'msg-A' },
  { step: 'dependency change: switch to B', action: 'Subscribe to B', counts: { A: 0, B: 1 }, last: 'none' },
  { step: 'publish to A (old subscription gone)', action: 'Publish to A', counts: { A: 0, B: 1 }, last: 'none' },
  { step: 'publish to B', action: 'Publish to B', counts: { A: 0, B: 1 }, last: 'msg-B' },
  { step: 'unmount', action: 'Unmount subscriber', counts: { A: 0, B: 0 }, last: null },
  { step: 'mount again', action: 'Mount subscriber', counts: { A: 0, B: 1 }, last: 'none' },
  { step: 'unmount again', action: 'Unmount subscriber', counts: { A: 0, B: 0 }, last: null },
]
const results = { inputs: table.map((r) => r.action), expected: table, actual: [] }

const server = await createServer({
  root: labDir,
  configFile: false,
  logLevel: 'silent',
  server: { host: '127.0.0.1' },
})
await server.listen()
const url = server.resolvedUrls.local[0]
const browser = await chromium.launch()

try {
  const page = await browser.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(url)

  for (const row of table) {
    if (row.action) await page.getByRole('button', { name: row.action, exact: true }).click()

    // Compare actual listener counts against the reference table
    await expect
      .poll(() => page.evaluate(() => window.__bus.counts()), { message: row.step })
      .toEqual(row.counts)

    const msg = page.getByTestId('last-message')
    if (row.last === null) {
      await expect(msg).toHaveCount(0)
    } else {
      await expect(msg).toHaveText(`Last message: ${row.last}`)
    }

    results.actual.push({
      step: row.step,
      counts: await page.evaluate(() => window.__bus.counts()),
      last: row.last === null ? null : await msg.textContent(),
    })
  }

  if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '))
  results.status = 'PASS'
  console.log('PASS: R19-T013 checks passed')
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
