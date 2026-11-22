# R19-T054: Day 22 Effect Cleanup — State/Invariant Lab (Added Activity)

A focused React applied lab demonstrating event subscriptions, `useEffect` cleanup execution, and strict listener invariants. This is an added activity, not an original numbered exercise. All data is local with no live APIs.

## The Contract
- Subscribes to an event source using `useEffect` with an explicit cleanup function.
- Changing dependencies (e.g. switching subscription channel) unregisters the old subscription and registers the new one, keeping total active listeners strictly at 1.
- Unmounting the component runs the cleanup function and leaves zero active listeners.

## Contribution Focus: State and Test the Invariant
- **The Core Invariant:**
  $$\text{Active Listeners Count} = \begin{cases} 1 & \text{if mounted} \\ 0 & \text{if unmounted} \end{cases}$$
- This invariant is evaluated and verified across a sequence of operations: initial mount, event dispatch, channel switching (removing old listener and binding new), unmounting (dropping to 0), and re-mounting.

## Automated Check
From the repository root:
```bash
node 22_Form_Using_Hooks/applied-labs/r19-t054/check.mjs
```
The check runs Playwright assertions to exercise channel switching, event emissions, unmount cleanup, and invariant validation across each step with zero console errors. Results are saved to `work/R19-T054/results.json`.
