# R19-T015: Class lifecycle cleanup, deterministic fixture lab (applied lab)

Added activity (not an original numbered exercise). A class component subscribes to an injected event source in `componentDidMount` and unsubscribes in `componentWillUnmount`.

- Contribution focus: the event source is injected as a prop and uses a local deterministic fixture (fixed events `event-1`, `event-2`, `event-3`; no timers, randomness or network). `check.mjs` runs the scenario twice in isolated browser contexts and requires identical results.
- Inputs: emit event-1, unmount, emit event-2, remount, emit event-3, unmount.
- Expected: mount adds exactly one listener, unmount removes it (0 left), remount does not double notifications (event-3 arrives once).
- Run (from repo root): `node 07_Day_Class_Components/applied-labs/r19-t015/check.mjs`
- Exits non-zero if a check fails or the page logs errors.
- Setup: `cd 07_Day_Class_Components/applied-labs/r19-t015 && npm install && npx playwright install chromium`
