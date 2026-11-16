# Cat gallery — Day 20 applied lab (R19-T036)

A fixture-backed cat gallery with pagination, retry and a
stale-response guard. Changing page replaces the records; a failed
page shows an error with a Retry button; a slow page's late response
can never overwrite a newer page.

## The contract

| Step | Operation | Expected result |
| --- | --- | --- |
| 1 | Load | Page 1: Milo, Luna, Oliver |
| 2 | Go to page 2 | Bella, Charlie, Daisy — Milo gone |
| 3 | Go to page 3 | First attempt fails: error + Retry, no cats |
| 4 | Retry | Page 3: Simba, Chloe, Max |
| 5 | Click page 1, then page 2 at once | Page 2 stays: page 1 is slow (700 ms), page 2 is fast (80 ms), and the late page 1 response is ignored |

## The refactor

The contribution focus is visible in the code: the page loading was
extracted out of the component into one clearly named responsibility,
`loadCatPage(page)` in `catPageLoader.js`. It owns the fixture lookup,
the per-page latency and the first-attempt failure of page 3 — nothing
else. `example.jsx` only owns UI state and one request id: every load
bumps the id, and a resolving promise whose id is no longer the latest
is ignored. That guard is the stale-response fix, and the check proves
it in step 5. The contract is unchanged by the extraction — the check
in `check.mjs` is the behaviour captured before the refactor, run
against the code after it.

## The local fixture

`fixture.mjs` holds the three pages, their cats and their latencies.
No live API is used — the Day 20 lesson's cat APIs are the
inspiration, not a dependency, so the lab runs offline and
deterministically.

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 20_projects/applied-labs/r19-t036/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
