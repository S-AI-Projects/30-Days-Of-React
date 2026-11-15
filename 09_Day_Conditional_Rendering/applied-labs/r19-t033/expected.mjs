// Independent expected-result table for the R19-T033 lab.
// This file is the reference: it states what each state must render,
// separately from the component's implementation in example.jsx.
// The check compares the rendered page against this table.
export const EXPECTED = {
  loading: 'Loading…',
  empty: 'No results found.',
  success: ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson'],
  error: 'Something went wrong.',
  unknown: 'Unknown view.',
};
