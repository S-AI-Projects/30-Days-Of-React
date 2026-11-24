import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T020')

// The decisive condition and its temporary one-line mutant.
// The mutant is applied in memory by a Vite plugin; it is never written to disk.
const DECISIVE = 'const known = Object.hasOwn(BADGES, status)'
const MUTANT = 'const known = status in BADGES'

// Independent expected table.
const UNKNOWN = 'Unknown status'
const table = [
  { label: 'pending', text: 'Pending', known: true },
  { label: 'success', text: 'Success', known: true },
  { label: 'error', text: 'Error', known: true },
  { label: 'banana', text: UNKNOWN, known: false },
  { label: 'constructor', text: UNKNOWN, known: false },
  { label: 'toString', text: UNKNOWN, known: false },
  { label: '(missing)', text: UNKNOWN, known: false },
]
const results = { inputs: table.map((r) => r.label), expected: table, decisive: DECISIVE, mutant: MUTANT }

const mutantPlugin = {
  name: 'r19-t020-mutant',
  enforce: 'pre',
  transform(code, id) {
    if (id.split('?')[0].endsWith('/example.jsx')) {
      return { code: code.replace(DECISIVE, MUTANT), map: null }
    }
  },
}

let browser

// Start the app (with or without the mutant), run the focused checks, stop the app.
async function runAgainst(plugins) {
  const server = await createServer({
    root: labDir,
    configFile: false,
    logLevel: 'silent',
    server: { host: '127.0.0.1' },
    plugins,
  })
  await server.listen()
  const url = server.resolvedUrls.local[0]
  const context = await browser.newContext()
  const page = await context.newPage()
  const pageErrors = []
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(String(e)))

  const failures = []
  const actual = []
  try {
    await page.goto(url)
    const rows = page.getByTestId('row')
    await expect(rows).toHaveCount(table.length)
    for (let i = 0; i < table.length; i++) {
      const badge = rows.nth(i).getByTestId('badge')
      const exp = table[i]
      try {
        await expect(badge).toHaveText(exp.text, { timeout: 2000 })
        await expect(badge).toHaveAttribute('data-known', String(exp.known), { timeout: 2000 })
      } catch {
        failures.push(exp.label)
      }
      actual.push({ label: exp.label, text: await badge.textContent(), known: await badge.getAttribute('data-known') })
    }
  } finally {
    await context.close()
    await server.close()
  }
  return { failures, actual, pageErrors }
}

try {
  const source = fs.readFileSync(path.join(labDir, 'example.jsx'), 'utf8')
  if (source.split(DECISIVE).length - 1 !== 1) {
    throw new Error('Decisive line not found exactly once in example.jsx: ' + DECISIVE)
  }

  browser = await chromium.launch()

  // 1. The correct example must pass every check.
  const correct = await runAgainst([])
  results.correct = correct
  expect(correct.failures).toEqual([])
  expect(correct.pageErrors).toEqual([])

  // 2. The mutant must be CAUGHT: the focused test fails on it.
  const mutant = await runAgainst([mutantPlugin])
  results.mutant_run = mutant
  expect(mutant.failures.length).toBeGreaterThan(0)
  expect(mutant.failures).toContain('constructor')
  console.log('Mutant caught. Failing rows on the mutant:', mutant.failures.join(', '))

  results.status = 'PASS'
  console.log('PASS: R19-T020 checks passed (correct example passes, mutant is caught)')
} catch (err) {
  results.status = 'FAIL'
  results.error = String(err)
  console.error('FAIL:', err)
  process.exitCode = 1
} finally {
  results.versions = { node: process.version, chromium: browser ? browser.version() : null }
  fs.mkdirSync(workDir, { recursive: true })
  fs.writeFileSync(path.join(workDir, 'results.json'), JSON.stringify(results, null, 2))
  if (browser) await browser.close()
}
