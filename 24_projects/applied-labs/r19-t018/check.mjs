import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T018')
const errors = []

const E = 'Empty: fill in the form'
const R = 'Error: fix the fields below'
const V = 'Valid: ready to submit'

// Independent expected table. One session, no reload between rows.
const scenario = [
  { step: 'initial: EMPTY state', status: E, nameMsg: 'Name is required', emailMsg: 'Email is required', nameValue: '', emailValue: '' },
  { step: 'email = ada: ERROR state', fill: ['Email', 'ada'], status: R, nameMsg: 'Name is required', emailMsg: 'Email must look like name@host', nameValue: '', emailValue: 'ada' },
  { step: 'name = Ada (email still bad)', fill: ['Name', 'Ada'], status: R, nameMsg: 'OK', emailMsg: 'Email must look like name@host', nameValue: 'Ada', emailValue: 'ada' },
  { step: 'email = ada@x.com: RECOVERY to valid', fill: ['Email', 'ada@x.com'], status: V, nameMsg: 'OK', emailMsg: 'OK', nameValue: 'Ada', emailValue: 'ada@x.com' },
  { step: 'name = spaces only: ERROR again', fill: ['Name', '   '], status: R, nameMsg: 'Name is required', emailMsg: 'OK', nameValue: '   ', emailValue: 'ada@x.com' },
  { step: 'name = Ada: RECOVERY again', fill: ['Name', 'Ada'], status: V, nameMsg: 'OK', emailMsg: 'OK', nameValue: 'Ada', emailValue: 'ada@x.com' },
  { step: 'reset: EMPTY again (not stale)', click: 'Reset', status: E, nameMsg: 'Name is required', emailMsg: 'Email is required', nameValue: '', emailValue: '' },
  { step: 'name = Ada, email = a@b: RECOVERY after reset', fill: [['Name', 'Ada'], ['Email', 'a@b']], status: V, nameMsg: 'OK', emailMsg: 'OK', nameValue: 'Ada', emailValue: 'a@b' },
]
const results = { inputs: scenario.map((s) => s.fill ?? s.click ?? null), expected: scenario, actual: [] }

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

  // Marker proves the example is never restarted or reloaded during the run.
  await page.evaluate(() => { window.__sameSession = 'yes' })

  for (const row of scenario) {
    if (row.fill) {
      const fills = Array.isArray(row.fill[0]) ? row.fill : [row.fill]
      for (const [label, value] of fills) {
        await page.getByLabel(label, { exact: true }).fill(value)
      }
    }
    if (row.click) await page.getByRole('button', { name: row.click, exact: true }).click()

    await expect(page.getByTestId('form-status'), row.step).toHaveText(row.status)
    await expect(page.getByTestId('name-message'), row.step).toHaveText(row.nameMsg)
    await expect(page.getByTestId('email-message'), row.step).toHaveText(row.emailMsg)
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(row.nameValue)
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue(row.emailValue)

    results.actual.push({
      step: row.step,
      status: await page.getByTestId('form-status').textContent(),
      nameMsg: await page.getByTestId('name-message').textContent(),
      emailMsg: await page.getByTestId('email-message').textContent(),
    })
  }

  // Never restarted: the marker set at the start is still there.
  expect(await page.evaluate(() => window.__sameSession)).toBe('yes')

  if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '))
  results.status = 'PASS'
  console.log('PASS: R19-T018 checks passed (error and empty states recover in one session)')
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
