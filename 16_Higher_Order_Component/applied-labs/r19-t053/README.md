# R19-T053: Day 16 Class Example Integration — Reference Comparison Lab (Added Activity)

A focused React applied lab demonstrating master-detail composition using lesson class patterns and explicit state ownership. This is an added activity, not an original numbered exercise. All data is local with no live APIs.

## The Contract
- Master list and detail view built with explicit state ownership.
- Selecting Record B updates only the detail panel with Record B's content.
- Clearing the selection returns the detail panel to its empty state.

## Contribution Focus: Reference Comparison
- The expected behavior and state transitions are explicitly specified in `reference.mjs`.
- The automated check steps through user interactions and compares the live application states directly against this independent reference table.

## Automated Check
From the repository root:
```bash
node 16_Higher_Order_Component/applied-labs/r19-t053/check.mjs
```
The check uses Playwright assertions to step through selection and clearing actions, compares live DOM state against the reference table, verifies 0 console/page errors, and writes results to `work/R19-T053/results.json`.
