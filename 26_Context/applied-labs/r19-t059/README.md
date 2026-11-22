# R19-T059: Day 26 Context Scope — Input-Scale Experiment (Added Activity)

A focused React applied lab demonstrating Context API scoping, provider nesting, subtree independence, and bounded input-scale experiments. This is an added activity, not an original numbered exercise. All data is local with no live APIs.

## The Contract
- **Context Propagation:** Toggling the root theme context updates all consumer cards residing within that provider scope.
- **Subtree Isolation:** An independently nested subtree maintains its own distinct `ThemeProvider` and state; toggling the root theme does not alter the subtree's theme, and toggling the subtree theme does not alter the root.
- **Input-Scale Experiment:** Tests three bounded input sizes ($N = 1, 3, 5$ consumers) and repeated interaction counts, asserting correctness and reporting operation and render counts rather than enforcing arbitrary speed thresholds.

## Contribution Focus: Bounded Scale Experiments & Render Verification
- Evaluates behavior across $N=1$, $N=3$, and $N=5$ consumers.
- Measures and asserts that each consumer within the target scope receives state transitions deterministically while outside scopes remain invariant.

## Automated Check
From the repository root:
```bash
node 26_Context/applied-labs/r19-t059/check.mjs
```
The check runs Playwright assertions to verify subtree independence, execute the 3 bounded input-scale experiments, record render and operation counts, and verify zero console errors. Results are saved to `work/R19-T059/results.json`.
