# R19-T036 evidence — Day 20 cat gallery (failure recovery lab)

## Inputs

A fixture-backed cat gallery (`fixture.mjs`): three pages of cats,
all local, no live API. Page 1: Milo, Luna, Oliver (700 ms simulated
latency). Page 2: Bella, Charlie, Daisy (80 ms). Page 3: Simba,
Chloe, Max (80 ms, fails on its first attempt so the retry path is
exercisable). The contribution focus is the refactor: page loading
was extracted out of the component into one clearly named
responsibility, `loadCatPage(page)` in `catPageLoader.js`; the
component only owns UI state and one request id that ignores stale
responses.

## Operation sequence (expected vs actual)

| Step | Operation | Expected | Actual |
| --- | --- | --- | --- |
| 1 | Load | Page 1: Milo, Luna, Oliver (3 cats) | Milo, Luna, Oliver (3 cats) |
| 2 | Go to page 2 | Bella, Charlie, Daisy; Milo gone | Bella, Charlie, Daisy; Milo gone |
| 3 | Go to page 3 | Error "Failed to load page 3.", Retry shown, 0 cats | Error shown, Retry shown, 0 cats |
| 4 | Retry | Page 3: Simba, Chloe, Max; error gone | Simba, Chloe, Max; error gone |
| 5 | Click page 1, then page 2 at once | Page 2 cats stay; status "Page 2 of 3" | Bella, Charlie, Daisy; status "Page 2 of 3" |

## Check command

From the repository root:

```
node 20_projects/applied-labs/r19-t036/check.mjs
```

Result: **13/13 pass, exit 0, no console or page errors**.

## Negative test

Mutant: the stale-response guard removed from `example.jsx` (both
`if (id !== requestId.current) return;` lines). The same check then
exits 1 with exactly 2 failures — "stale response ignored" and
"status reads Page 2 of 3" — because the late page 1 response
overwrites page 2. All other 11 assertions still pass, so the check
isolates the guard. The mutant was reverted after the test and the
check passes 13/13 again.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
