# R19-T025: Day 23 hook with an injected data source, deterministic fixture lab (added activity)

A small React hook, `useData(fetcher, key)`, that loads data through an injected asynchronous source and handles stale responses explicitly. This is an added activity, not an original numbered exercise. All data is local, with no live APIs.

## The contract

- The data source is injected: `fetcher(key, { signal })` returns a promise.
- A late response, or a late error, for a previous key is ignored.
- A new key resets the loading and error state, and the previous key's data is never shown for the new key.
- When the key changes, the previous request is aborted through its signal.
- Selecting the same key again starts no new request.

## Contribution focus: injection and two isolated runs agree

The page injects its own fixture source. Every request waits until the page releases or fails it, so there are no timers, no real network and no storage. The order in which responses arrive is under the test's control, and request ids restart at #1 on every page load.

`check.mjs` plays one sequence of 14 actions twice:

1. Run 1 is judged against a hand-written table of the expected status, data, error and request list after every action.
2. Run 2 starts from scratch in a new browser context and must produce exactly the same snapshot as Run 1 at every step.

It also checks that no request leaves localhost and that there are no console or page errors.

## Expected results

| Action | Status | Data or error |
| --- | --- | --- |
| select alpha | Loading | none |
| select beta while #1 is pending | Loading | #1 is aborted |
| release #2 | Success | Beta data |
| release #1 (late alpha) | Success | still Beta data |
| select gamma | Loading | data cleared |
| fail #3 | Error | Failed to load gamma |
| select alpha | Loading | error cleared |
| release #4 | Success | Alpha data |
| select alpha again | Success | no new request |
| select beta, then gamma | Loading | #5 is aborted |
| fail #5 (late beta error) | Loading | ignored |
| release #6 | Success | Gamma data |

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed link.

## Automated check

From the repository root, run `node 23_Fetching_Data_Using_Hooks/applied-labs/r19-t025/check.mjs`. It starts the app, launches Chromium, plays the sequence twice in isolated browser contexts, rejects console and page errors, and exits non-zero if any assertion fails. Results, the expected table, both transcripts and tool versions are saved to `work/R19-T025/results.json`.