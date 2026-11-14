# R19-T009 / R19-T010 — Day 13: Lifecycle Request Cleanup (Regression-Focused Lab)

## Overview

This lab demonstrates asynchronous request cancellation and cleanup in React functional components using the `useEffect` cleanup return callback. It guarantees two critical invariants:
1. **Out-of-Order Parameter Change Race Protection**: If a slow request for parameter `A` completes after a fast request for parameter `B`, the stale response for `A` cannot overwrite `B`.
2. **Unmount Safety**: When a component is unmounted while a request is in-flight, no state update is triggered on unmounted components and no console/runtime errors occur.

## Decisive Condition & Mutant Verification

The decisive condition inside `useEffect` is:
```javascript
if (!isSubscribed) {
  return; // Ignore stale or unmounted response
}
```

The automated test suite in `check.mjs` executes a **regression mutant comparison**:
- **Standard Run (Correct Code)**: Triggering slow query "alpha" followed immediately by fast query "beta" resolves to "beta" (alpha's stale response is cleanly discarded).
- **Mutated Run (Bug Injection)**: When the `if (!isSubscribed) return;` guard is bypassed, alpha's stale resolution overwrites beta's result. The test suite asserts that the mutant fails this decisive check, confirming test sensitivity.

## Usage

```bash
node 13_Day_Controlled_Versus_Uncontrolled_Input/applied-labs/r19-t010/check.mjs
```
