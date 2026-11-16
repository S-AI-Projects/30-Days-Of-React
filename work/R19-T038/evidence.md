# R19-T038 evidence — Day 25 toggle panels (failure-and-recovery lab)

## Inputs

The same `useToggle` hook as R19-T035 — `[value, toggle, setValue, reset]`
— used by two independent panels (A starts off, B starts on). Each
panel also takes a typed word (`on` / `off`, any case, spaces ignored)
that sets it through the hook's `setValue`. Anything else is an error
state: the panel does not change and `Enter on or off.` appears. The
next valid word recovers, with no restart of the example.

## Expected vs actual (one page session, no reload)

| Step | Input | Expected A / B | Actual A / B |
| --- | --- | --- | --- |
| 1 | Load | off / on, no errors | off / on, no errors |
| 2 | Toggle A | on / on | on / on |
| 3 | Apply `maybe` to A | on, error shown / on | on, error shown / on |
| 4 | Apply `off` to A | off, error gone / on | off, error gone / on |
| 5 | Toggle B | off / off | off / off |
| 6 | Reset B | off / on | off / on |
| 7 | Apply `` (empty) to B | off / on, error shown | off / on, error shown |
| 8 | Apply `OFF` to B | off / off, error gone | off / off, error gone |

Toggling either panel leaves the other unchanged in every step.

## Check command

From the repository root:

```
node 25_Custom_Hooks/applied-labs/r19-t038/check.mjs
```

Result: **14/14 pass, exit 0, no console or page errors**.

## Negative test

Mutant: `parseToggleInput` accepted any non-empty word as `on`, so
`maybe` set the panel instead of erroring. The same check then exits 1
with exactly 1 failure ("invalid word shows the error"). The mutant
was reverted after the test.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
