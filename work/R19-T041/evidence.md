# Evidence: R19-T041 Cat Gallery Filtering Lab

## Overview
- **Task ID:** R19-T041
- **URN:** e26b07f0587
- **Branch:** `student/e26b07f0587/R19-T041`
- **Goal:** Render a local cat fixture and filter it by origin without requiring an API.
- **Contribution Focus:** Provide a small independent expected-result table and reference implementation for the defined behavior; compare actual results against it.

## Fixture Inputs
The lab uses strictly local fixture data (no external API calls):
```json
[
  {
    "id": 1,
    "name": "Nile",
    "origin": "Egypt",
    "temperament": "Alert, Agile, Intelligent",
    "description": "A graceful spotted cat native to Egypt."
  },
  {
    "id": 2,
    "name": "Sakura",
    "origin": "Japan",
    "temperament": "Playful, Loving, Intelligent",
    "description": "An iconic Japanese Bobtail with expressive features."
  },
  {
    "id": 3,
    "name": "Cairo",
    "origin": "Egypt",
    "temperament": "Curious, Loyal, Lively",
    "description": "An affectionate Egyptian cat known for high agility."
  }
]
```

## Expected vs Actual Results Table

| Step | Scenario | Filter Input | Expected Count | Expected Cats | Actual Count | Actual Cats | Status |
|------|----------|--------------|----------------|---------------|--------------|-------------|--------|
| 1 | Initial state: all cats displayed | `(empty)` | 3 | Nile, Sakura, Cairo | 3 | Nile, Sakura, Cairo | **PASS** |
| 2 | Filter by Egypt: Nile and Cairo | `Egypt` | 2 | Nile, Cairo | 2 | Nile, Cairo | **PASS** |
| 3 | Filter by Japan: Sakura | `Japan` | 1 | Sakura | 1 | Sakura | **PASS** |
| 4 | Filter by Brazil: empty state | `Brazil` | 0 | (empty state) | 0 | (empty state) | **PASS** |
| 5 | Clear filter: restore all cats | `(empty)` | 3 | Nile, Sakura, Cairo | 3 | Nile, Sakura, Cairo | **PASS** |

## Console & Page Errors
- Console errors: `0`
- Page errors: `0`
- Failed requests: `0`

## Test Execution Details
- **Exact Test Command:** `node 19_projects/applied-labs/r19-t041/check.mjs`
- **Exit Code:** `0`
- **Overall Result:** **PASSED**

## Negative / Mutant Testing
A mutant test was executed by temporarily mutating the filter predicate in `example.jsx` from equality (`===`) to inequality (`!==`).
- **Result:** The check immediately failed at Step 2 (`Scenario "Filter by Egypt: Nile and Cairo": expected 2 cats, found 1`), cleanly shutting down the browser and server, and exiting with status code `1`.
- The mutation was reverted and full regression verification passed with exit code `0`.

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Chromium:** `157.0.8103.79`
