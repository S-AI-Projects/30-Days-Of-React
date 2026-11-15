# R19-T033 evidence — Day 9 result views (reference comparison lab)

## Inputs

The page renders the same `ResultView` component five times, once per
state. The independent reference table (`expected.mjs`) states what
each state must render:

| State | Expected rendering |
| --- | --- |
| `loading` | "Loading…" |
| `empty` | "No results found." |
| `success` | List: Ada Lovelace, Grace Hopper, Katherine Johnson |
| `error` | "Something went wrong." |
| anything else | "Unknown view." |

Each supplied state renders exactly one corresponding message or
result list — never two views at once, never a blank view.

## Check command

From the repository root:

```
node 09_Day_Conditional_Rendering/applied-labs/r19-t033/check.mjs
```

## Expected vs actual (verification run, 2026-11-15)

| Assertion | Expected | Actual |
| --- | --- | --- |
| loading matches the reference | Loading… | Loading… |
| empty matches the reference | No results found. | No results found. |
| error matches the reference | Something went wrong. | Something went wrong. |
| unknown matches the reference | Unknown view. | Unknown view. |
| success renders three results | 3 | 3 |
| success items match the reference | Ada Lovelace, Grace Hopper, Katherine Johnson | Ada Lovelace, Grace Hopper, Katherine Johnson |
| five views are rendered | 5 | 5 |
| only the success view renders a list | 1 list | 1 list |
| no view is blank | all non-empty | all non-empty |
| no page errors | 0 | 0 |
| no console errors | 0 | 0 |

Result: **11/11 pass, exit 0.**

## Negative test

Mutant: the empty view rendered "Nothing here." instead of the
reference "No results found.". The same check then exits 1 with
exactly 1 failure ("empty matches the reference"). The check rejects
a broken contract. The mutant was reverted after the test.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
