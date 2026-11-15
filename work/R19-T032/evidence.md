# R19-T032 evidence — Day 4 status badge (boundary-focused lab)

## Inputs

The page renders the same `StatusBadge` component eight times, each with a
different `status` prop:

| Case | `status` prop | Expected badge text |
| --- | --- | --- |
| Known | `pending` | Pending… |
| Known | `success` | Success |
| Known | `error` | Error |
| Unknown word | `archived` | Unknown status |
| Capitalised | `Pending` | Unknown status |
| Leading space | ` pending` | Unknown status |
| Empty | `""` | Unknown status |
| Missing | (no prop) | Unknown status |

The boundary: the badge knows exactly `pending`, `success`, `error`,
matched exactly and case-sensitively, with no trimming and no case
folding. Everything outside that set renders the fallback "Unknown
status" — never a blank badge.

## Check command

From the repository root:

```
node 04_Day_Components/applied-labs/r19-t032/check.mjs
```

## Expected vs actual (verification run, 2026-11-15)

| Assertion | Expected | Actual |
| --- | --- | --- |
| pending shows its text | Pending… | Pending… |
| success shows its text | Success | Success |
| error shows its text | Error | Error |
| unknown word shows the fallback | Unknown status | Unknown status |
| capitalised status shows the fallback | Unknown status | Unknown status |
| status with a space shows the fallback | Unknown status | Unknown status |
| empty status shows the fallback | Unknown status | Unknown status |
| missing status shows the fallback | Unknown status | Unknown status |
| eight badges are rendered | 8 | 8 |
| fallback appears exactly five times | 5 | 5 |
| no badge is blank | all non-empty | all non-empty |
| no page errors | 0 | 0 |
| no console errors | 0 | 0 |

Result: **14/14 pass, exit 0.**

## Negative test

Mutant: `success` mapped to the fallback text instead of "Success".
The same check then exits 1 with exactly 2 failures ("success shows
its text", "fallback appears exactly five times"). The check rejects a
broken contract. The mutant was reverted after the test.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
