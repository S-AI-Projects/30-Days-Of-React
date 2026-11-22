# R19-T051: Day 9 Conditional Display (Added Activity)

A focused React applied lab demonstrating explicit state conditional rendering. This is an added activity, not an original numbered exercise. All data is local with no external APIs.

## The Contract
- Renders exactly one corresponding view (`loading`, `empty`, `success`, `error`) based on explicit state.
- In `loading` state: displays loading message with `data-testid="view-loading"`.
- In `empty` state: displays empty message with `data-testid="view-empty"`.
- In `success` state: displays list of items with `data-testid="view-success"`.
- In `error` state: displays error message with `data-testid="view-error"`.
- No views overlap or render simultaneously.

## Contribution Focus
Implement the required behavior from the explicit contract; show the smallest useful complete example.

## Automated Check
From the repository root:
```bash
node 09_Day_Conditional_Rendering/applied-labs/r19-t051/check.mjs
```
The check uses Playwright assertions to exercise all four states in an automated browser, verifies view exclusivity, confirms no console/page errors, and writes outputs to `work/R19-T051/results.json`.
