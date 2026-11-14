# Applied Lab R19-T004: Fetch Hook Cancellation & State Invariant Lab

## Objective
Demonstrate robust lifecycle cancellation and stale-response rejection in an asynchronous data fetching custom hook (`useCancellableFetch`). When requests are triggered in rapid succession, responses belonging to superseded keys are discarded so race conditions never corrupt application state.

## Core Invariants
1. **Reset Invariant**: Whenever the query `key` changes, `loading` resets immediately to `true` and any previous `error` resets to `null`.
2. **Stale Response Discard Invariant**: If a slow request for Key A is initiated and superseded by a fast request for Key B, Key A's resolution must never overwrite Key B's rendered data.
3. **Key-Data Consistency Invariant**: When `data` is present and `loading === false`, `data.key` strictly matches the currently selected `activeKey`.
4. **Error Recovery**: Moving from an errored key to a valid key cleanly resets the error state and recovers normal data display.

## Running the Automated Checks
```bash
node 23_Fetching_Data_Using_Hooks/applied-labs/r19-t004/check.mjs
```
The test suite launches headless Chromium, triggers race conditions between slow and fast requests, verifies invariant satisfaction across sequential state transitions, confirms zero console errors, and stores evidence in `work/R19-T004/`.
