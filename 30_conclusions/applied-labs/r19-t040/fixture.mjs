// Deterministic local fixture for the R19-T040 lab.
// The two tasks the check adds through the UI, and the expected
// outcome of the capstone sequence: add both, complete the first,
// filter completed — exactly one remains, and it is the completed one.
export const TASKS_TO_ADD = ['Buy milk', 'Read chapter 3'];

export const COMPLETE_INDEX = 0;

export const EXPECTED_COMPLETED = 'Buy milk';
export const EXPECTED_ACTIVE = 'Read chapter 3';
