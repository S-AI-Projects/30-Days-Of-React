
import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const labDir = path.dirname(fileURLToPath(import.meta.url))
const workDir = path.resolve(labDir, '../../../work/R19-T011')
const errors = []
const results = { inputs: ['Egypt', 'Brazil'], expected: {}, actual: {} }

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

    // Filter focus: Egypt/Japan/Egypt fixture filtered to Egypt -> 2 records
    await page.getByLabel('Filter by origin').fill('Egypt')
    results.expected.egyptCount = 2
    results.actual.egyptCount = await page.getByTestId('cat-card').count()
    await expect(page.getByTestId('cat-card')).toHaveCount(2)

    // Empty result shows a message
    await page.getByLabel('Filter by origin').fill('Brazil')
    results.expected.emptyMessage = 'No cats found for this origin.'
    results.actual.emptyMessage = await page.getByTestId('empty-message').textContent()
    await expect(page.getByTestId('empty-message')).toBeVisible()

    if (errors.length) throw new Error('Console/page errors: ' + errors.join(' | '))
    results.status = 'PASS'
    console.log('PASS: R19-T011 checks passed')
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
