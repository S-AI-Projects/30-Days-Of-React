# R19-T022: Day 5 props contract, boundary-focused lab (added activity)

A small React example of a `Rating` component that takes `value` and `max` props. It shows `3/5`, a meaningful empty state, and explicit messages for invalid input. This is an added activity, not an original numbered exercise.

## The contract

- `value=3, max=5` shows `3/5`. `max` defaults to 5.
- A missing value (`undefined`, `null` or `""`) shows `Not rated`.
- Valid means `max` is a whole number of at least 1 and `0 <= value <= max`. Both ends are inclusive.
- `value` below 0 or above `max` shows `Out of range`.
- A `value` that is `NaN` or not a number (for example the text `"3"`) shows `Invalid value`.
- `max` below 1 or not a whole number shows `Invalid max`. This is checked first.

## Inputs and expected result

| Input | Expected |
| --- | --- |
| value=3, max=5 | 3/5 |
| value=4 (default max) | 4/5 |
| no value, null, "" | Not rated |
| value=0, max=5 | 0/5 |
| value=5, max=5 | 5/5 |
| value=1, max=1 | 1/1 |
| value=5.1, 6 or -1, max=5 | Out of range |
| value=NaN or "3" | Invalid value |
| max=0 or 2.5 | Invalid max |

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed link.

## Automated check

From the repository root, run `node 05_Day_Props/applied-labs/r19-t022/check.mjs`. It starts the app, launches Chromium, checks every case above plus the boundary values, rejects console and page errors, and exits non-zero if any assertion fails. Results and tool versions are saved to `work/R19-T022/results.json`.