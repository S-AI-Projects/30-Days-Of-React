# Status badge — Day 4 applied lab (R19-T032)

One reusable `StatusBadge` component (Day 4: Components), rendered eight
times with a different `status` prop each time.

## Contract

- `pending` → "Pending…", `success` → "Success", `error` → "Error".
- Any other status renders the explicit fallback "Unknown status" — never
  a blank badge.

## The boundary condition

The badge knows exactly three statuses — `pending`, `success`, `error` —
matched exactly and case-sensitively, with no trimming and no case
folding. Everything outside that set is unknown: another word
(`archived`), a capitalised word (`Pending`), a word with a space
(` pending`), an empty string, or no status at all. All of them render
the same fallback text.

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 04_Day_Components/applied-labs/r19-t032/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
