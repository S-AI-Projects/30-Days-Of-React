# R19-T055: Day 8 State Updates — Deterministic Fixture Lab (Added Activity)

A focused React applied lab demonstrating state updates with boundary constraints. This is an added activity, not an original numbered exercise. All data is local with no live APIs.

## The Contract
- Implements a quantity control with increment and decrement operations.
- Enforces a zero lower bound: decrementing when the value is 0 leaves the value at 0.
- Two increments followed by one decrement yields 1.

## Contribution Focus: Deterministic Fixtures & Isolated Runs
- All actions and expected states are declared in `fixture.mjs`.
- The automated check runs the complete operation sequence across **two isolated browser contexts** and asserts that:
  1. Both runs match the deterministic fixture table exactly.
  2. Both independent runs agree completely with each other.
  3. Boundary conditions (zero lower bound) are strictly preserved.

## Automated Check
From the repository root:
```bash
node 08_Day_States/applied-labs/r19-t055/check.mjs
```
The check runs the full contract via Playwright across multiple contexts, verifies zero console/page errors, and writes results to `work/R19-T055/results.json`.
