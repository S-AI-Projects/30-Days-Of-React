# R19-T013: Effect cleanup reference comparison (applied lab)

Added activity (not an original numbered exercise). A component subscribes to a local event source with `useEffect`. The cleanup function removes the old subscription when the channel changes, and the last one on unmount.

- Contribution focus: `check.mjs` holds an independent expected-result table (listener counts per channel and last message at each step) and compares the running app against it.
- Inputs: Publish to A, Publish to B, Subscribe to B, Unmount subscriber, Mount subscriber (see the table in `check.mjs`).
- Expected: a dependency change leaves 0 listeners on the old channel; unmount leaves 0 listeners in total.
- Run (from repo root): `node 22_Form_Using_Hooks/applied-labs/r19-t013/check.mjs`
- Exits non-zero if any check fails or the page logs errors.
- Setup: `cd 22_Form_Using_Hooks/applied-labs/r19-t013 && npm install && npx playwright install chromium`
