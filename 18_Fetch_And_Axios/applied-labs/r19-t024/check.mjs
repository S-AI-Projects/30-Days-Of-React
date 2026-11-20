import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = dirname(fileURLToPath(import.meta.url));
const workDir = resolve(labDir, '../../../work/R19-T024');

const IDS = ['groceries', 'ideas', 'todo'];
const TITLES = { groceries: 'Groceries', ideas: 'Ideas', todo: 'To do' };
const INITIAL = {
  groceries: 'milk, eggs',
  ideas: 'build a note editor',
  todo: 'write the check',
};

// Oracle 1: hand-written expected-result table, independent of example.jsx.
// After each operation: which notes are dirty, which note is selected, and the editor text.
const OPS = [
  { type: 'none', label: 'initial state', dirty: [], selected: 'groceries', editor: 'milk, eggs' },
  { type: 'edit', text: 'milk, eggs, tea', label: 'edit Groceries', dirty: ['groceries'], selected: 'groceries', editor: 'milk, eggs, tea' },
  { type: 'select', id: 'ideas', label: 'select Ideas (selection changes no marker)', dirty: ['groceries'], selected: 'ideas', editor: 'build a note editor' },
  { type: 'edit', text: 'build a note editor v2', label: 'edit Ideas', dirty: ['groceries', 'ideas'], selected: 'ideas', editor: 'build a note editor v2' },
  { type: 'save', label: 'save Ideas (clears only Ideas)', dirty: ['groceries'], selected: 'ideas', editor: 'build a note editor v2' },
  { type: 'select', id: 'groceries', label: 'select Groceries (draft is kept)', dirty: ['groceries'], selected: 'groceries', editor: 'milk, eggs, tea' },
  { type: 'edit', text: 'milk, eggs', label: 'edit Groceries back to its saved text', dirty: [], selected: 'groceries', editor: 'milk, eggs' },
  { type: 'edit', text: 'milk', label: 'edit Groceries to new text', dirty: ['groceries'], selected: 'groceries', editor: 'milk' },
  { type: 'save', label: 'save Groceries', dirty: [], selected: 'groceries', editor: 'milk' },
  { type: 'save', label: 'save a clean note (no change)', dirty: [], selected: 'groceries', editor: 'milk' },
  { type: 'select', id: 'todo', label: 'select To do', dirty: [], selected: 'todo', editor: 'write the check' },
  { type: 'edit', text: '', label: 'edit To do to an empty draft', dirty: ['todo'], selected: 'todo', editor: '' },
  { type: 'save', label: 'save the empty To do note', dirty: [], selected: 'todo', editor: '' },
  { type: 'select', id: 'groceries', label: 'select Groceries (saved text persisted)', dirty: [], selected: 'groceries', editor: 'milk' },
];

// Oracle 2: a small reference model written separately from the component.
// A note is dirty if and only if draft !== saved.
function makeModel() {
  const saved = { ...INITIAL };
  const draft = { ...INITIAL };
  let selected = 'groceries';
  return {
    apply(op) {
      if (op.type === 'edit') draft[selected] = op.text;
      else if (op.type === 'save') saved[selected] = draft[selected];
      else if (op.type === 'select') selected = op.id;
    },
    dirty: () => IDS.filter((id) => draft[id] !== saved[id]),
    selected: () => selected,
    editor: () => draft[selected],
  };
}

const steps = [];
const problems = [];
let failed = false;
let server;
let browser;
let chromiumVersion = 'not launched';

async function step(name, input, expected, fn) {
  try {
    const actual = await fn();
    steps.push({ name, input, expected, actual, pass: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed = true;
    const message = String(error.message).split('\n')[0];
    steps.push({ name, input, expected, actual: message, pass: false });
    console.log(`FAIL  ${name}\n      ${message}`);
  }
}

function pkgVersion(name) {
  const file = resolve(labDir, 'node_modules', name, 'package.json');
  return JSON.parse(readFileSync(file, 'utf8')).version;
}

async function perform(page, op) {
  if (op.type === 'edit') await page.getByTestId('editor').fill(op.text);
  else if (op.type === 'save') await page.getByTestId('save').click();
  else if (op.type === 'select') await page.getByTestId(`select-${op.id}`).click();
}

async function readDirty(page) {
  const dirty = [];
  for (const id of IDS) {
    if ((await page.getByTestId(`dirty-${id}`).count()) === 1) dirty.push(id);
  }
  return dirty;
}

try {
  // Launch the local app.
  server = await createServer({
    root: labDir,
    logLevel: 'error',
    server: { port: 5196 },
  });
  await server.listen();
  const origin = new URL(server.resolvedUrls.local[0]).origin;

  // Launch the browser.
  browser = await chromium.launch();
  chromiumVersion = browser.version();
  const page = await browser.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));

  await page.goto(`${origin}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Note editor lab');

  const model = makeModel();

  for (const [i, op] of OPS.entries()) {
    const expectedText = `dirty: [${op.dirty.join(', ') || 'none'}]; selected: ${op.selected}; editor: "${op.editor}"`;
    await step(`Step ${i + 1}: ${op.label}`, op.label, expectedText, async () => {
      // The reference model must agree with the hand-written table first.
      model.apply(op);
      expect(model.dirty()).toEqual(op.dirty);
      expect(model.selected()).toBe(op.selected);
      expect(model.editor()).toBe(op.editor);

      await perform(page, op);

      // Invariant on the real page: marker if and only if the note is dirty.
      for (const id of IDS) {
        await expect(page.getByTestId(`dirty-${id}`)).toHaveCount(op.dirty.includes(id) ? 1 : 0);
      }
      await expect(page.getByTestId('editor')).toHaveValue(op.editor);
      await expect(page.getByTestId('editor-title')).toHaveText(TITLES[op.selected]);
      await expect(page.getByTestId('status')).toHaveText(
        op.dirty.includes(op.selected) ? 'Unsaved changes' : 'Saved',
      );

      return `dirty: [${(await readDirty(page)).join(', ') || 'none'}]; editor: "${await page.getByTestId('editor').inputValue()}"`;
    });
  }

  await step('No console or page errors', 'whole run', 'no errors collected', async () => {
    expect(problems).toEqual([]);
    return problems;
  });
} catch (error) {
  failed = true;
  console.error('Setup error:', error);
} finally {
  // Close the browser and the local app.
  await browser?.close();
  await server?.close();
}

// Save evidence for the PR.
mkdirSync(workDir, { recursive: true });
const report = {
  task: 'R19-T024',
  invariant: 'a note is dirty if and only if its draft differs from its saved text',
  passed: !failed,
  versions: {
    node: process.version,
    vite: pkgVersion('vite'),
    react: pkgVersion('react'),
    reactDom: pkgVersion('react-dom'),
    playwrightTest: pkgVersion('@playwright/test'),
    chromium: chromiumVersion,
  },
  expectedTable: OPS.map(({ label, dirty, selected, editor }) => ({ operation: label, dirty, selected, editor })),
  steps,
};
writeFileSync(resolve(workDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');

console.log(failed ? '\nCHECK FAILED' : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);