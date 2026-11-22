// Deterministic action fixture and expected quantity states
export const FIXTURE_ACTIONS = [
  { step: 1, action: 'initial_render', click: null, expected: 0 },
  { step: 2, action: 'decrement_at_zero', click: 'btn-dec', expected: 0 },
  { step: 3, action: 'increment_first', click: 'btn-inc', expected: 1 },
  { step: 4, action: 'increment_second', click: 'btn-inc', expected: 2 },
  { step: 5, action: 'decrement_once', click: 'btn-dec', expected: 1 },
  { step: 6, action: 'decrement_to_zero', click: 'btn-dec', expected: 0 },
  { step: 7, action: 'decrement_below_zero_attempt', click: 'btn-dec', expected: 0 }
];
