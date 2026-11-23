import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T014')
const errors = []

const operations = [
  { step: 'initial state', field: null, value: null },
  { step: 'set biography', field: 'Biography', value: 'Loves compilers' },
  { step: 'biography becomes whitespace only', field: 'Biography', value: '   ' },
  { step: 'set biography again', field: 'Biography', value: 'Loves compilers' },
  { step: 'clear biography', field: 'Biography', value: '' },
  { step: 'change name to Grace', field: 'Name', value: 'Grace' },
  { step: 'change role to Mentor', field: 'Role', value: 'Mentor' },
]

const results = {
  inputs: operations,
  invariant: 'name once, role once, bio only if non-blank, no "undefined"/"null"',
  expected: [],
  actual: [],
}

const model = { Name: 'Ada', Role: 'Student', Biography: '' }

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
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(url)

  for (const op of operations) {
    if (op.field) {
      await page.getByLabel(op.field, { exact: true }).fill(op.value)
      model[op.field] = op.value
    }

    const bioShown = model.Biography.trim() !== ''
    const expected = {
      step: op.step,
      name: model.Name,
      role: `Role: ${model.Role}`,
      bio: bioShown ? model.Biography : null,
    }

    results.expected.push(expected)

    await expect(page.getByTestId('profile-name')).toHaveText(expected.name)
    await expect(page.getByTestId('profile-role')).toHaveText(expected.role)

    if (bioShown) {
      await expect(page.getByTestId('profile-bio')).toHaveText(expected.bio)
    } else {
      await expect(page.getByTestId('profile-bio')).toHaveCount(0)
    }

    const text = await page.getByTestId('profile').innerText()
    expect(text).not.toContain('undefined')
    expect(text).not.toContain('null')
    expect(text.split(model.Name).length - 1).toBe(1)
    expect(text.split(model.Role).length - 1).toBe(1)

    results.actual.push({ step: op.step, profileText: text })
  }

  if (errors.length) {
    throw new Error('Console/page errors: ' + errors.join(' | '))
  }

  results.status = 'PASS'
  console.log('PASS: R19-T014 checks passed')
} catch (err) {
  results.status = 'FAIL'
  results.error = String(err)
  console.error('FAIL:', err)
  process.exitCode = 1
} finally {
  results.versions = { node: process.version, chromium: browser.version() }
  fs.mkdirSync(workDir, { recursive: true })
  fs.writeFileSync(
    path.join(workDir, 'results.json'),
    JSON.stringify(results, null, 2),
  )
  await browser.close()
  await server.close()
}
