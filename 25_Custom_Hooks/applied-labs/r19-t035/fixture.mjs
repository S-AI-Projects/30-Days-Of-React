// Deterministic local fixture for the R19-T035 lab.
// The expected panel states after each step of the operation sequence.
// The check runs the sequence twice in two isolated runs and compares
// both runs against this fixture — and against each other.
export const EXPECTED = [
  { label: 'initial', a: 'off', b: 'on' },
  { label: 'toggle A', a: 'on', b: 'on' },
  { label: 'toggle A again', a: 'off', b: 'on' },
  { label: 'set A on', a: 'on', b: 'on' },
  { label: 'reset A', a: 'off', b: 'on' },
  { label: 'toggle B', a: 'off', b: 'off' },
  { label: 'set B off', a: 'off', b: 'off' },
  { label: 'reset B', a: 'off', b: 'on' },
];
