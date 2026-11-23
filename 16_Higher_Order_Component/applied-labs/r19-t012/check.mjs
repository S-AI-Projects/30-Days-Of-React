import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T012')
const errors = []
const results = {
    inputs: { select: 'Record B', validIds: ['1', '3'], invalidIds: ['0', '4', 'abc', '', '1.5'] },
    expected: {},
    actual: {},
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

    const list = page.getByTestId('record-list')
    const empty = page.getByTestId('empty-state')
    const detailTitle = page.getByTestId('detail').locator('h2')

    // Start: nothing selected -> empty state
    await expect(empty).toBeVisible()
    await expect(list).toHaveAttribute('data-renders', '1')

    // Select B -> only the detail panel updates (list is not re-rendered)
    await page.getByRole('button', { name: 'Record B' }).click()
    await expect(detailTitle).toHaveText('Record B')
    await expect(list).toHaveAttribute('data-renders', '1')
    results.expected.afterSelectB = { detail: 'Record B', listRenders: '1' }
    results.actual.afterSelectB = {
        detail: await detailTitle.textContent(),
        listRenders: await list.getAttribute('data-renders'),
    }

    // Clear selection -> empty state
    await page.getByRole('button', { name: 'Clear selection' }).click()
    await expect(empty).toBeVisible()

    // Boundary: valid ids 1 and 3 select a record
    const input = page.getByLabel('Jump to record id')
    const go = page.getByRole('button', { name: 'Go', exact: true })
    for (const [id, title] of [['1', 'Record A'], ['3', 'Record C']]) {
        await input.fill(id)
        await go.click()
        await expect(detailTitle).toHaveText(title)
    }

    // Boundary: invalid ids give the empty state (after a valid selection)
    results.actual.invalid = {}
    for (const bad of results.inputs.invalidIds) {
        await page.getByRole('button', { name: 'Record A' }).click()
        await expect(detailTitle).toHaveText('Record A')
        await input.fill(bad)
        await go.click()
        await expect(empty).toBeVisible()
        results.actual.invalid[bad === '' ? '(empty)' : bad] = 'empty state shown'
    }
    results.expected.invalid = 'empty state shown for every invalid id'

    if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '))
    results.status = 'PASS'
    console.log('PASS: R19-T012 checks passed')
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