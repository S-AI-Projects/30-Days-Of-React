// Deterministic local fixture for the R19-T036 lab.
// Three pages of cats, all local — no live API. Each page has its own
// simulated latency, and page 3 fails on its first attempt so the retry
// path is exercisable. The check compares the rendered page against
// this fixture after every step.
export const CAT_PAGES = {
  1: { cats: ['Milo', 'Luna', 'Oliver'], delayMs: 700 },
  2: { cats: ['Bella', 'Charlie', 'Daisy'], delayMs: 80 },
  3: { cats: ['Simba', 'Chloe', 'Max'], delayMs: 80, failFirstAttempt: true },
};

export const PAGE_COUNT = 3;

// Expected visible state after each step of the check's sequence.
export const EXPECTED = [
  { label: 'initial load', page: 1, cats: ['Milo', 'Luna', 'Oliver'] },
  { label: 'go to page 2', page: 2, cats: ['Bella', 'Charlie', 'Daisy'] },
  { label: 'page 3 fails first', page: 3, cats: [], error: true },
  { label: 'retry page 3', page: 3, cats: ['Simba', 'Chloe', 'Max'] },
  {
    label: 'rapid 1 then 2 (stale page 1 ignored)',
    page: 2,
    cats: ['Bella', 'Charlie', 'Daisy'],
  },
];
