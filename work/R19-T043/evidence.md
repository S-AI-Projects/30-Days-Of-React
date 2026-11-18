# Evidence: R19-T043 Derived Filtered Total from Props Lab

## Overview
- **Task ID:** R19-T043
- **URN:** e26b07f0587
- **Branch:** `R19-T043` (and `student/e26b07f0587/R19-T043`)
- **Goal:** Derive a filtered total from props without mutating the supplied records. Paid amounts 10 and 5 plus unpaid 20 display 15; the input array remains unchanged.
- **Contribution Focus:** State and test the invariant connecting input/state to output across a short sequence of operations.

## Input Records
The lab receives the following frozen local fixture records via props:
```json
[
  {
    "id": 1,
    "label": "Hosting & Server Maintenance",
    "amount": 10,
    "paid": true
  },
  {
    "id": 2,
    "label": "Domain Registration Renewal",
    "amount": 5,
    "paid": true
  },
  {
    "id": 3,
    "label": "Cloud Storage Expansion",
    "amount": 20,
    "paid": false
  }
]
```

## Stated Mathematical Invariant
$$\text{Output Total}(R, S) = \sum_{r \in R, \text{match}(r, S)} r.\text{amount}$$
$$\text{subject to } R_{t} \equiv R_{0} \quad (\text{zero in-place mutations on input array or objects})$$

## Expected vs Actual Results Table Across Operations

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|------|----------|--------|-----------------|---------------|--------|
| 1 | Initial state: Paid amounts 10 and 5 plus unpaid 20 display total 15 | `Mount` | 15 | 15 | **PASS** |
| 2 | Immutability check: Input array length and records remain unaltered | `Verify input records` | 3 | 3 | **PASS** |
| 3 | Invariant across Op 1: Switch filter to "Unpaid" displays 20 | `Filter: Unpaid` | 20 | 20 | **PASS** |
| 4 | Invariant across Op 2: Switch filter to "All" displays 35 (10 + 5 + 20) | `Filter: All` | 35 | 35 | **PASS** |
| 5 | Invariant across Op 3: Switch filter back to "Paid" restores 15 | `Filter: Paid` | 15 | 15 | **PASS** |
| 6 | Invariant across Op 4: Add new paid record ($30) immutably displays 45 | `Add Record ($30, paid)` | 45 | 45 | **PASS** |
| 7 | Invariant across Op 5: Toggle record 3 ($20) to paid immutably displays 65 | `Toggle Record 3 Paid` | 65 | 65 | **PASS** |
| 8 | Invariant across Op 6: Reset restores initial state and displays 15 | `Reset` | 15 | 15 | **PASS** |

## Console & Page Errors
- Console errors: `0`
- Page errors: `0`
- Failed requests: `0`

## Test Execution Details
- **Exact Test Command:** `node 02_Day_Introduction_to_React/applied-labs/r19-t043/check.mjs`
- **Exit Code:** `0`
- **Overall Result:** **PASSED**

## Negative / Mutant Testing
A mutant test was executed by temporarily mutating the derivation logic in `example.jsx` to include unpaid records or use in-place `.splice()` on the array.
- **Result:** The check immediately failed at Step 1 (`Initial filtered total must be 15, got 35`), cleanly shutting down the browser and server, and exiting with status code `1`.
- The mutation was reverted and full regression verification passed with exit code `0`.

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Chromium:** `131.0.6778.33`
