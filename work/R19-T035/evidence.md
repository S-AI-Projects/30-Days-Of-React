# R19-T035 evidence — Day 25 toggle panels (deterministic fixture lab)

## Inputs

One `useToggle` hook with a stable interface —
`[value, toggle, setValue, reset]` — used by two independent panels.
Panel A starts off, panel B starts on. The deterministic local fixture
(`fixture.mjs`) states the expected panel states after each step of
the operation sequence. The hook uses no time, storage, events or
network, so the fixture is the whole repeatable input.

## Operation sequence (expected vs actual, run 1)

| Step | Operation | Expected A / B | Actual A / B |
| --- | --- | --- | --- |
| 1 | Load | off / on | off / on |
| 2 | Toggle A | on / on | on / on |
| 3 | Toggle A again | off / on | off / on |
| 4 | Set A on | on / on | on / on |
| 5 | Reset A | off / on | off / on |
| 6 | Toggle B | off / off | off / off |
| 7 | Set B off | off / off | off / off |
| 8 | Reset B | off / on | off / on |

Toggling either panel leaves the other unchanged in every step.

## Check command

From the repository root:

```
node 25_Custom_Hooks/applied-labs/r19-t035/check.mjs
```

Result: **11/11 pass, exit 0, no console or page errors** — including
"two isolated runs agree": the same sequence run a second time in a
fresh browser context produces byte-identical snapshots.

## Negative test

Mutant: `toggle` set the value to `true` instead of flipping it. The
same check then exits 1 with exactly 2 failures (both toggle-flip
steps: "toggle A again" and "toggle B"). The fixture comparison
catches the broken hook; the "two isolated runs agree" check still
passes under the mutant, as expected — both runs run the same broken
code, so agreement alone proves nothing and the fixture is what
rejects it. The mutant was reverted after the test.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
