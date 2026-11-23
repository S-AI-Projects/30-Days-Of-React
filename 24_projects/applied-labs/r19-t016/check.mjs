import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T016')
const errors = []

// Independent expected-result table (the behaviour captured from the original version).
const scenario = [
  { step: 'initial', name: 'invalid', email: 'invalid', form: 'invalid', nameValue: '', emailValue: '' },
  { step: 'name = Ada', fill: ['Name', 'Ada'], name: 'valid', email: 'invalid', form: 'invalid', nameValue: 'Ada', emailValue: '' },
  { step: 'email = ada (no @)', fill: ['Email', 'ada'], name: 'valid', email: 'invalid', form: 'invalid', nameValue: 'Ada', emailValue: 'ada' },
  { step: 'email = ada@x.com', fill: ['Email', 'ada@x.com'], name: 'valid', email: 'valid', form: 'valid', nameValue: 'Ada', emailValue: 'ada@x.com' },
  { step: 'name = spaces only', fill: ['Name', '   '], name: 'invalid', email: 'valid', form: 'invalid', nameValue: '   ', emailValue: 'ada@x.com' },
  { step: 'name = Ada again', fill: ['Name', 'Ada'], name: 'valid', email: 'valid', form: 'valid', nameValue: 'Ada', emailValue: 'ada@x.com' },
  { step: 'reset (derived values must not be stale)', click: 'Reset', name: 'invalid', email: 'invalid', form: 'invalid', nameValue: '', emailValue: '' },
  { step: 'email = a@b after reset', fill: ['Email', 'a@b'], name: 'invalid', email: 'valid', form: 'invalid', nameValue: '', emailValue: 'a@b' },
]
const results = { inputs: scenario.map((s) => s.fill ?? s.click ?? null), expected: scenario, actual: {} }

const server = await createServer({
  root: labDir,
  configFile: false,
  logLevel: 'silent',
  server: { host: '127.0.0.1' },
})
await server.listen()
const url = server.resolvedUrls.local[0]
const browser = await chromium.launch()

async function runScenario(version) {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(`${url}?version=${version}`)
  await expect(page.getByTestId('form')).toHaveAttribute('data-version', version)

  const actual = []
  for (const row of scenario) {
    if (row.fill) await page.getByLabel(row.fill[0], { exact: true }).fill(row.fill[1])
    if (row.click) await page.getByRole('button', { name: row.click, exact: true }).click()

    await expect(page.getByTestId('name-validity'), row.step).toHaveText(row.name)
    await expect(page.getByTestId('email-validity'), row.step).toHaveText(row.email)
    await expect(page.getByTestId('form-validity'), row.step).toHaveText(row.form)
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(row.nameValue)
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue(row.emailValue)

    actual.push({
      step: row.step,
      name: await page.getByTestId('name-validity').textContent(),
      email: await page.getByTestId('email-validity').textContent(),
      form: await page.getByTestId('form-validity').textContent(),
      nameValue: await page.getByLabel('Name', { exact: true }).inputValue(),
      emailValue: await page.getByLabel('Email', { exact: true }).inputValue(),
    })
  }
  await context.close()
  return actual
}

try {
  results.actual.original = await runScenario('original')
  results.actual.refactored = await runScenario('refactored')

  // The refactor must not change the contract.
  expect(results.actual.refactored).toEqual(results.actual.original)

  if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '))
  results.status = 'PASS'
  console.log('PASS: R19-T016 checks passed (original and refactored behave identically)')
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
