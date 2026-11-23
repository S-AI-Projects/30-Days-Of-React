# R19-T018: Hook composition, failure-and-recovery lab (applied lab)

Added activity (not an original numbered exercise). A form (name + email) built from two composed hooks. `useFormValues` holds the only source of truth (the field values). `useDerivedStatus` derives the errors and the form status from those values on every render, so nothing can go stale after reset.

- Contribution focus: demonstrate the empty and error states, then a successful recovery on the next valid input, without restarting the example. `check.mjs` loads the page once, never reloads it, and verifies a session marker is still present at the end.
- Inputs: email = ada (error), name = Ada, email = ada@x.com (recovery), name = spaces only (error again), name = Ada (recovery), Reset (empty again), name = Ada and email = a@b (recovery).
- Expected: the status moves between "Empty", "Error" and "Valid" correctly at every step, and after Reset the messages are recalculated.
- Run (from repo root): `node 24_projects/applied-labs/r19-t018/check.mjs`
- Exits non-zero if a check fails or the page logs errors.
- Setup: `cd 24_projects/applied-labs/r19-t018 && npm install && npx playwright install chromium`
