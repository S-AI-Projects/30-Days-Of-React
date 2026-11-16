# Toggle panels — Day 25 failure-and-recovery lab (R19-T038)

The same `useToggle` hook as R19-T035 — `[value, toggle, setValue, reset]`
— used by two independent panels. Panel A starts off, panel B starts
on. Toggling one panel never touches the other; set and reset are
explicit operations.

## The failure-and-recovery part

Each panel also takes a typed word that sets it through the hook's
`setValue`: type `on` or `off` (any case, spaces ignored) and press
Apply. Anything else is an error state — the panel does not change
and `Enter on or off.` appears. The next valid word recovers: the
error clears and the panel updates, **without restarting the
example** (no reload, no reset).

## Expected result

| Step | Input | Panel A | Panel B |
| --- | --- | --- | --- |
| 1 | Load | off | on |
| 2 | Toggle A | on | on |
| 3 | Apply `maybe` to A | on, error shown | on |
| 4 | Apply `off` to A | off, error gone | on |
| 5 | Toggle B | off | off |
| 6 | Reset B | off | on |
| 7 | Apply `` (empty) to B | off | on, error shown |
| 8 | Apply `OFF` to B | off | off, error gone |

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 25_Custom_Hooks/applied-labs/r19-t038/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure. It drives both
failure-and-recovery arcs in a single page session — no reload.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
