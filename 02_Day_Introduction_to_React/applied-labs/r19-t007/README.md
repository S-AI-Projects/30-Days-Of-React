# R19-T007 — Day 02: Introduction to React — Filtered Total without Mutating Records

## Overview

This applied lab demonstrates a pure, immutable calculation pattern: derive a total from a list of paid/unpaid records without mutating the original array. The UI exposes the original records and the calculated grand total from the subset of paid items.

## Behavioural Contract

| Input records | Expected output |
|---|---|
| `Alpha = 10, paid` | Included in total |
| `Bravo = 5, paid` | Included in total |
| `Charlie = 20, unpaid` | Excluded from total |

The expected total is therefore `15`.

## Implementation Notes

- The calculation uses `filter()` to keep only paid items.
- The calculation uses `reduce()` to sum those values.
- The original `records` array is never mutated; the calculation uses a derived collection and a pure reducer.
- No timers, live APIs, or random data are used.

## Usage

```bash
# From the repository root
node 02_Day_Introduction_to_React/applied-labs/r19-t007/check.mjs
```

## File Structure

```text
02_Day_Introduction_to_React/applied-labs/r19-t007/
├── example.jsx   — React component implementing the filtered total contract
├── check.mjs     — Playwright verification script
├── package.json  — React 18 + Playwright configuration
├── README.md     — Lab contract and invariants
```

## Invariants

1. The visible paid total is exactly `15`.
2. The record list still contains three entries: `Alpha`, `Bravo`, and `Charlie`.
3. The source array remains unchanged after deriving the total.
4. Zero console errors and zero unhandled page errors during interaction.
