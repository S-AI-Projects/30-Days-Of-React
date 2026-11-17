// Local cat fixture data and independent reference model for R19-T041.
// Strictly local data - no external API is used.

export const CATS = [
  {
    id: 1,
    name: 'Nile',
    origin: 'Egypt',
    temperament: 'Alert, Agile, Intelligent',
    description: 'A graceful spotted cat native to Egypt.',
  },
  {
    id: 2,
    name: 'Sakura',
    origin: 'Japan',
    temperament: 'Playful, Loving, Intelligent',
    description: 'An iconic Japanese Bobtail with expressive features.',
  },
  {
    id: 3,
    name: 'Cairo',
    origin: 'Egypt',
    temperament: 'Curious, Loyal, Lively',
    description: 'An affectionate Egyptian cat known for high agility.',
  },
];

/**
 * Independent reference filter implementation.
 * Used to verify the expected-result table and cross-check real application behavior.
 */
export function referenceFilter(cats, originQuery) {
  if (!originQuery || originQuery.trim() === '') {
    return [...cats];
  }
  const query = originQuery.trim().toLowerCase();
  return cats.filter((cat) => cat.origin.toLowerCase() === query);
}

/**
 * Independent expected-result table for all test scenarios.
 */
export const EXPECTED_SCENARIOS = [
  {
    step: 1,
    name: 'Initial state: all cats displayed',
    filterInput: '',
    expectedCount: 3,
    expectedCats: ['Nile', 'Sakura', 'Cairo'],
    expectEmptyState: false,
    description: 'Initial page load with no filter must show all 3 fixture cats.',
  },
  {
    step: 2,
    name: 'Filter by Egypt: Nile and Cairo',
    filterInput: 'Egypt',
    expectedCount: 2,
    expectedCats: ['Nile', 'Cairo'],
    expectEmptyState: false,
    description: 'Filtering by Egypt must display exactly Nile and Cairo.',
  },
  {
    step: 3,
    name: 'Filter by Japan: Sakura',
    filterInput: 'Japan',
    expectedCount: 1,
    expectedCats: ['Sakura'],
    expectEmptyState: false,
    description: 'Filtering by Japan must display exactly Sakura.',
  },
  {
    step: 4,
    name: 'Filter by Brazil: empty state',
    filterInput: 'Brazil',
    expectedCount: 0,
    expectedCats: [],
    expectEmptyState: true,
    emptyMessage: 'No cats found for origin "Brazil".',
    description: 'Filtering by Brazil (not in fixture) must display the empty-state message.',
  },
  {
    step: 5,
    name: 'Clear filter: restore all cats',
    filterInput: '',
    expectedCount: 3,
    expectedCats: ['Nile', 'Sakura', 'Cairo'],
    expectEmptyState: false,
    description: 'Clearing the filter must restore all 3 fixture cats.',
  },
];

