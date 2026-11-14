# R19-T006 — Day 09: Conditional Rendering — Explicit State View Lab

## Overview

This applied lab demonstrates a clean conditional rendering pattern where the screen is driven by explicit state rather than ad-hoc nested conditions. The component exposes a single `status` value and renders one of four views: loading, empty, success, and error.

## Behavioural Contract

| State | Expected outcome |
|---|---|
| `loading` | Shows the loading view with the text `Loading your data...` |
| `empty` | Shows the empty view with the text `No items available.` |
| `success` | Shows the success view with the `items-list` and two rendered names |
| `error` | Shows the error view with the text `Something went wrong. Please try again.` and a `Retry` button |

The component also contains a clearly named sub-responsibility: `DataStateView`. It centralizes the conditional rendering logic so each branch is handled in a single place.

## Implementation Notes

- The controlling state is explicit and predictable: `loading`, `empty`, `success`, and `error`.
- The UI is refactored into a dedicated `DataStateView` helper instead of scattering conditionals inside the main component.
- No timers, live APIs, or random data are used.

## Usage

```bash
# From the repository root
node 09_Day_Conditional_Rendering/applied-labs/r19-t006/check.mjs
```

## File Structure

```text
09_Day_Conditional_Rendering/applied-labs/r19-t006/
├── example.jsx   — React component implementing the view-state contract
├── check.mjs     — Playwright verification script
├── package.json  — React 18 + Playwright configuration
├── README.md     — Lab contract and invariants
```

## Invariants

1. `#loading-view` is visible when the loading button is clicked.
2. `#empty-view` is visible when the empty button is clicked.
3. `#success-view` contains `#items-list` with exactly 2 items.
4. `#error-view` is visible when the error button is clicked and includes `#retry-btn`.
5. Zero console errors and zero unhandled page errors during the full interaction sequence.
