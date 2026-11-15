# Toggle panels — Day 25 applied lab (R19-T035)

`useToggle` is a custom hook with a stable interface —
`[value, toggle, setValue, reset]` — used by two independent panels.
Panel A starts off, panel B starts on. Toggling one panel never
touches the other; set and reset are explicit operations.

## Operation sequence

| Step | Operation | Panel A | Panel B |
| --- | --- | --- | --- |
| 1 | Load | off | on |
| 2 | Toggle A | on | on |
| 3 | Toggle A again | off | on |
| 4 | Set A on | on | on |
| 5 | Reset A | off | on |
| 6 | Toggle B | off | off |
| 7 | Set B off | off | off |
| 8 | Reset B | off | on |

## The deterministic fixture

`fixture.mjs` holds the expected panel states after each step. The
hook uses no time, storage, events or network, so the fixture is the
whole repeatable input. The check runs the sequence twice in two
isolated browser contexts and compares both runs against the fixture —
and against each other.

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 25_Custom_Hooks/applied-labs/r19-t035/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
