# Selectable list — Day 29 applied lab (R19-T034)

A controlled `SelectableList` component: the parent owns the selected
id, the list only reflects it. One list has three items — Ada Lovelace,
Grace Hopper (disabled) and Katherine Johnson — plus buttons for a
controlled update and a controlled clear. A second list is empty.

## The invariant

After every operation, the readout, the `aria-selected` marks and the
parent state agree:

- at most one option has `aria-selected="true"`;
- that option's label is the one the readout names (`Selected: none`
  when nothing is selected);
- a disabled option is never selected.

## Operations tested

| Operation | Expected result |
| --- | --- |
| Load | `Selected: none`, no option selected |
| Click Ada | `Selected: Ada Lovelace` |
| Click disabled Grace | Nothing changes — Grace stays unselected |
| Focus Katherine, press Enter | `Selected: Katherine Johnson` |
| Focus Ada, press ArrowDown | Focus moves to Grace |
| Click "Select Ada" (parent button) | `Selected: Ada Lovelace` |
| Click "Clear selection" (parent button) | `Selected: none` |
| Empty list | "No items.", no options |

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 29_explore/applied-labs/r19-t034/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
