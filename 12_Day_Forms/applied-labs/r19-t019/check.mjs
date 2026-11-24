import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T019')
const errors = []

// Contract: quantity=2, price=50, discount=10% displays 90.
// Invalid input shows a labelled error and no total.
const invalidCases = [
  { field: 'Quantity', value: 'abc', testid: 'quantity-error', message: 'Quantity: must be a whole number from 1 to 1000' },
  { field: 'Quantity', value: '0', testid: 'quantity-error', message: 'Quantity: must be a whole number from 1 to 1000' },
  { field: 'Quantity', value: '1.5', testid: 'quantity-error', message: 'Quantity: must be a whole number from 1 to 1000' },
  { field: 'Price', value: '-5', testid: 'price-error', message: 'Price: must be a number of 0 or more' },
  { field: 'Discount', value: '150', testid: 'discount-error', message: 'Discount: must be a number from 0 to 100' },
]
const allErrorIds = ['quantity-error', 'price-error', 'discount-error']

// Three bounded interaction counts. Start 2 x 50 with 10% off = 45 per unit.
// After N clicks of "+1 quantity": total = (2 + N) * 45.
const sizes = [1, 10, 50]

const results = {
  inputs: { default: { quantity: 2, price: 50, discount: 10 }, invalidCases, sizes },
  expected: { defaultTotal: 90, sizes: sizes.map((n) => ({ clicks: n, total: (2 + n) * 45, renderDelta: n, calcDelta: n })) },
  actual: { invalid: [], sizes: [] },
}

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

  const total = page.getByTestId('total')
  const reset = page.getByRole('button', { name: 'Reset', exact: true })
  const plus = page.getByRole('button', { name: '+1 quantity', exact: true })
  const readCounters = async () => {
    const el = page.getByTestId('counters')
    return {
      renders: Number(await el.getAttribute('data-renders')),
      calcs: Number(await el.getAttribute('data-calcs')),
    }
  }

  // 1. Default contract
  await expect(total).toHaveText('Total: 90')
  for (const id of allErrorIds) await expect(page.getByTestId(id)).toHaveCount(0)

  // 2. Invalid input shows a labelled error, then recovers
  for (const c of invalidCases) {
    await page.getByLabel(c.field, { exact: true }).fill(c.value)
    await expect(page.getByTestId(c.testid)).toHaveText(c.message)
    await expect(total).toHaveText('Total: n/a')
    for (const id of allErrorIds.filter((id) => id !== c.testid)) {
      await expect(page.getByTestId(id)).toHaveCount(0)
    }
    results.actual.invalid.push({ field: c.field, value: c.value, error: await page.getByTestId(c.testid).textContent() })
    await reset.click()
    await expect(total).toHaveText('Total: 90')
    await expect(page.getByTestId(c.testid)).toHaveCount(0)
  }

  // 3. Three bounded interaction counts: assert correctness, report operation counts.
  for (const n of sizes) {
    await reset.click()
    await expect(total).toHaveText('Total: 90')
    const before = await readCounters()

    for (let i = 0; i < n; i++) await plus.click()

    const expectedTotal = (2 + n) * 45
    await expect(total).toHaveText(`Total: ${expectedTotal}`)
    const after = await readCounters()
    const delta = { renders: after.renders - before.renders, calcs: after.calcs - before.calcs }

    // Report operation counts without enforcing an exact render or calculation count.

    results.actual.sizes.push({ clicks: n, total: expectedTotal, renderDelta: delta.renders, calcDelta: delta.calcs })
    console.log(`clicks=${n} total=${expectedTotal} renders=${delta.renders} calculations=${delta.calcs}`)
  }

  if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '))
  results.status = 'PASS'
  console.log('PASS: R19-T019 checks passed')
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
