# Evidence: R19-T042 Button & Keyboard Shortcut State Transition Lab

## Overview
- **Task ID:** R19-T042
- **URN:** e26b07f0587
- **Branch:** `R19-T042` (and `student/e26b07f0587/R19-T042`)
- **Goal:** Implement a button and keyboard shortcut that update the same state transition. Click and the documented key each increment once; irrelevant keys leave state unchanged.
- **Contribution Focus:** Concentrate on the stated boundary and invalid/empty-input behavior; explain the exact boundary condition in the lesson.

## Boundary Condition Specification
- **State Interval:** `[0, 10]` (`MIN_COUNT = 0`, `MAX_COUNT = 10`).
- **Initial State:** `0`.
- **Exact Boundary Condition:** At `count === 10`, the counter reaches its upper boundary. Further button clicks and documented `ArrowUp` keypresses are blocked from exceeding `10`. The Increment button is disabled, and an explicit boundary alert is shown.
- **Invalid / Empty Input Behavior:**
  - Irrelevant keys (`ArrowDown`, `a`, `x`, `Enter`, `Escape`, `Tab`, `Shift`, `Space`) leave state completely unchanged.
  - Submitting an empty string `""` to the value setter is rejected with an explicit validation message and leaves state unchanged.
  - Submitting non-numeric (`"abc"`), negative (`"-5"`), or out-of-boundary (`"99"`) inputs is rejected with explicit validation errors and leaves state unchanged.
  - Typing within input elements is isolated from global keyboard shortcut listeners.

## Expected vs Actual Results Table

| Step | Scenario | Input Action | Expected Count | Actual Count | Status |
|------|----------|--------------|----------------|--------------|--------|
| 1 | Initial state: count is 0, normal boundary status, button enabled | `Mount` | 0 | 0 | **PASS** |
| 2 | Single button click increments count to 1 | `Click increment button` | 1 | 1 | **PASS** |
| 3 | Single documented shortcut key (ArrowUp) increments count to 2 | `Key: ArrowUp` | 2 | 2 | **PASS** |
| 4 | Irrelevant keys leave state unchanged at 2 | `Keys: ArrowDown, a, x, Enter, Escape, Tab, Shift, Space` | 2 | 2 | **PASS** |
| 5 | Alternating button click and ArrowUp increment cleanly to 6 | `Click, ArrowUp, Click, ArrowUp` | 6 | 6 | **PASS** |
| 6 | Input field typing isolation: typing inside input does not trigger shortcut | `Type "ArrowUp" in manual input` | 6 | 6 | **PASS** |
| 7 | Empty-input handling: submitting empty input is rejected and leaves state at 6 | `Submit "" (empty string)` | 6 | 6 | **PASS** |
| 8 | Invalid-input handling: submitting non-numeric "abc" is rejected and leaves state at 6 | `Submit "abc"` | 6 | 6 | **PASS** |
| 9 | Invalid-input handling: submitting negative "-5" is rejected and leaves state at 6 | `Submit "-5"` | 6 | 6 | **PASS** |
| 10 | Invalid-input handling: submitting out-of-boundary "99" is rejected and leaves state at 6 | `Submit "99"` | 6 | 6 | **PASS** |
| 11 | Valid manual input within boundary sets count to 8 and clears error | `Submit "8"` | 8 | 8 | **PASS** |
| 12 | Increment to 9 via button, then to boundary 10 via ArrowUp | `Click, ArrowUp` | 10 | 10 | **PASS** |
| 13 | Exact boundary condition: at count 10, button is disabled and further ArrowUp keys do not exceed 10 | `3x ArrowUp + button click at max boundary` | 10 | 10 | **PASS** |
| 14 | Reset button restores count to 0 and clears boundary alert | `Click reset button` | 0 | 0 | **PASS** |
| 15 | Post-reset increment: button click increments count to 1 | `Click increment button` | 1 | 1 | **PASS** |

## Console & Page Errors
- Console errors: `0`
- Page errors: `0`
- Failed requests: `0`

## Test Execution Details
- **Exact Test Command:** `node 10_React_Project_Folder_Structure/applied-labs/r19-t042/check.mjs`
- **Exit Code:** `0`
- **Overall Result:** **PASSED**

## Negative / Mutant Testing
A mutant test was executed by temporarily modifying the boundary check in `example.jsx` from `prev >= MAX_COUNT` to `false` (allowing unlimited increments past 10).
- **Result:** The check immediately failed at Step 13 (`Count must remain strictly 10; cannot exceed boundary, got 13`), cleanly shutting down the browser and server, and exiting with status code `1`.
- The mutation was reverted and full regression verification passed with exit code `0`.

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Chromium:** `131.0.6778.33`
