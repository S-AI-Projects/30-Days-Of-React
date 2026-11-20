# R19-T026: Day 10 refactor of the button and keyboard shortcut example (added activity)

A refactor of a small React counter. This is an added activity, not an original numbered exercise. All data is local, with no live APIs.

## The contract (unchanged by the refactor)

- Clicking **Increment** adds 1.
- Pressing the documented key, `+`, adds 1. Both call the same `increment` function.
- Every other key leaves the count unchanged, including near-misses such as `=` and `-`.
- Holding `+` down counts once, because auto-repeat keydown events are ignored.
- Pressing Enter on the focused button is a normal click and adds 1.

## Contribution focus: capture the behavior, then extract one responsibility

- `baseline.jsx` is the working version. Its keyboard handling is written inline in the component.
- `example.jsx` is the refactor. It extracts one clearly named responsibility, `useKeyboardShortcut(key, onTrigger)`: call a handler once per press of one exact key, ignoring auto-repeat and every other key. The component just calls `useKeyboardShortcut(SHORTCUT_KEY, increment)`.

Open the page normally to see the refactor, or add `?version=baseline` to the address to see the baseline.

`check.mjs` captures the baseline's behavior by playing a sequence of 11 actions against it in a fresh browser context, then plays the identical actions against the refactor in another fresh context. The two transcripts must be identical, and both must match a hand-written expected table. A final step confirms the baseline wires `keydown` inline while the refactor delegates to the named hook.

## Expected results

| Step | Action | Count |
| --- | --- | --- |
| 1 | click Increment | 1 |
| 2 | press + | 2 |
| 3 | press a, Escape, ArrowUp, = and - | 2 |
| 4 | hold + (auto-repeat) | 3 |
| 5 | click Increment | 4 |
| 6 | press + | 5 |
| 7 | Enter on the focused button | 6 |

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed link.

## Automated check

From the repository root, run `node 10_React_Project_Folder_Structure/applied-labs/r19-t026/check.mjs`. It starts the app, launches Chromium, plays the sequence against both versions, rejects console and page errors, and exits non-zero if any assertion fails. Results, both transcripts, the expected table and tool versions are saved to `work/R19-T026/results.json`.