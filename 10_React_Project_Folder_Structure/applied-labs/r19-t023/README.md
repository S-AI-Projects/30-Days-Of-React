# R19-T023: Day 10 button and keyboard shortcut, reference comparison lab (added activity)

A small React counter where a button and a keyboard shortcut trigger the same state transition. This is an added activity, not an original numbered exercise.

## The contract

- Clicking **Increment** adds 1.
- Pressing the documented key, `+`, adds 1. Both call the same `increment` function.
- Every other key leaves the count unchanged, including near-misses such as `=` and `-`.
- Holding `+` down counts once, because auto-repeat keydown events are ignored.
- Pressing Enter on the focused button is a normal click and adds 1.

## Contribution focus: independent reference comparison

`check.mjs` does not trust the component to judge itself. It compares the real page against two independent sources:

1. A hand-written expected-result table of actions and the count that must follow each one.
2. A small reference model in `check.mjs` that computes the count from the action list without using any component code.

Before each action is judged against the page, the two sources must agree with each other. The page must then show exactly that count.

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

From the repository root, run `node 10_React_Project_Folder_Structure/applied-labs/r19-t023/check.mjs`. It starts the app, launches Chromium, replays the actions above against the page, rejects console and page errors, and exits non-zero if any assertion fails. Results, the expected table and tool versions are saved to `work/R19-T023/results.json`.