# Result views — Day 9 applied lab (R19-T033)

One `ResultView` component (Day 9: Conditional Rendering) that renders
exactly one view from an explicit `state` prop, using if/else. The page
renders the component five times, once per state.

## Contract

| State | Renders |
| --- | --- |
| `loading` | "Loading…" |
| `empty` | "No results found." |
| `success` | A list of three results |
| `error` | "Something went wrong." |
| anything else | "Unknown view." |

Each supplied state renders exactly one corresponding message or result
list — never two views at once, never a blank view.

## The reference

`expected.mjs` holds the independent expected-result table: the exact
text (or result list) each state must render, stated separately from
the component's implementation. The check compares the rendered page
against that table.

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 09_Day_Conditional_Rendering/applied-labs/r19-t033/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
