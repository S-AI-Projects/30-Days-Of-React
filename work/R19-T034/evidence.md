# R19-T034 evidence — Day 29 selectable list (state/invariant lab)

## Inputs

A controlled `SelectableList`: the parent owns the selected id, the
list only reflects it. Items: Ada Lovelace, Grace Hopper (disabled),
Katherine Johnson. A second list is empty.

## The invariant

After every operation, the readout, the `aria-selected` marks and the
parent state agree:

- at most one option has `aria-selected="true"`;
- that option's label is the one the readout names (`Selected: none`
  when nothing is selected);
- a disabled option is never selected.

## Operation sequence (expected vs actual)

| Step | Operation | Expected | Actual |
| --- | --- | --- | --- |
| 1 | Load | `Selected: none`, no option selected | `Selected: none`, no option selected |
| 2 | Click Ada | `Selected: Ada Lovelace` | `Selected: Ada Lovelace` |
| 3 | Click disabled Grace | Grace stays unselected, still `Selected: Ada Lovelace` | Grace stays unselected, still `Selected: Ada Lovelace` |
| 4 | Focus Katherine, press Enter | `Selected: Katherine Johnson` | `Selected: Katherine Johnson` |
| 5 | Focus Ada, press ArrowDown | Focus moves to Grace | Focus moves to Grace |
| 6 | Click "Select Ada" (parent button) | `Selected: Ada Lovelace` | `Selected: Ada Lovelace` |
| 7 | Click "Clear selection" (parent button) | `Selected: none` | `Selected: none` |
| 8 | Empty list | "No items.", no options | "No items.", no options |

## Check command

From the repository root:

```
node 29_explore/applied-labs/r19-t034/check.mjs
```

Result: **12/12 pass, exit 0, no console or page errors.**

## Negative test

Mutant: the click handler's disabled guard removed, so clicking Grace
selects it. The same check then exits 1 with exactly 2 failures
("disabled Grace stays unselected after a click" and "invariant still
holds after clicking disabled Grace"). The check rejects a broken
contract. The mutant was reverted after the test.

Note: `aria-disabled="true"` makes Playwright refuse a normal click on
the disabled option (it treats the element as not enabled), so the
check uses a forced click there — in a real browser `aria-disabled`
does not block the click event, and the component's own guard is what
must stop the selection.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
