import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T017')
const errors = []

const INVALID_MAX = 'Invalid rating: max must be a whole number of at least 1'
const INVALID_RANGE = 'Invalid rating: value must be between 0 and max'

// Independent expected table: input -> intermediate state -> output.
const table = [
  { input: 'value=3, max=5', state: 'status=rated', output: '3/5' },
  { input: 'value missing, max=5', state: 'status=empty', output: 'Not rated' },
  { input: 'value=0, max=5', state: 'status=rated', output: '0/5' },
  { input: 'value=5, max=5', state: 'status=rated', output: '5/5' },
  { input: 'value=6, max=5', state: 'status=invalid', output: INVALID_RANGE },
  { input: 'value=-1, max=5', state: 'status=invalid', output: INVALID_RANGE },
  { input: 'value=3, max=0', state: 'status=invalid', output: INVALID_MAX },
  { input: 'value=3, max=2.5', state: 'status=invalid', output: INVALID_MAX },
  { input: 'value=3, max missing (defaults to 5)', state: 'status=rated', output: '3/5' },
  { input: 'value="abc", max=5', state: 'status=invalid', output: 'Invalid rating: value must be a number' },
]
const results = { inputs: table.map((r) => r.input), expected: table, actual: [] }

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

  // The published examples on the page must match the expected table exactly.
  const rows = page.getByTestId('example-row')
  await expect(rows).toHaveCount(table.length)

  for (let i = 0; i < table.length; i++) {
    const row = rows.nth(i)
    const exp = table[i]
    await expect(row.getByTestId('example-input')).toHaveText(exp.input)
    await expect(row.getByTestId('example-state')).toHaveText(exp.state)
    await expect(row.getByTestId('rating')).toHaveText(exp.output)
    results.actual.push({
      input: await row.getByTestId('example-input').textContent(),
      state: await row.getByTestId('example-state').textContent(),
      output: await row.getByTestId('rating').textContent(),
    })
  }

  // The worked explanation in README.md must publish the same input -> state -> output lines.
  const readme = fs.readFileSync(path.join(labDir, 'README.md'), 'utf8')
  for (const exp of table) {
    expect(readme).toContain(`${exp.input} → ${exp.state} → ${exp.output}`)
  }

  if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '))
  results.status = 'PASS'
  console.log('PASS: R19-T017 checks passed')
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
