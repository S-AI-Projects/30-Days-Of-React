# Evidence: R19-T045 Injected Fetch Adapter Life Cycle Lab

## Overview
- **Task ID:** R19-T045
- **URN:** e26b07f0587
- **Branch:** `R19-T045` (and `student/e26b07f0587/R19-T045`)
- **Goal:** Use an injected fetch adapter with loading/error/retry states. Fixtures cover 200, rejected request and retry success; tests make no live API call.
- **Contribution Focus:** Inject time, storage, events or network where used; use repeatable local fixtures and show that two isolated runs agree.

## Input Fixtures
The lab utilizes frozen repeatable local fixtures with zero live external network calls:
1. **200 OK Fixture (`FIXTURE_200_DATA`):**
   - 3 Nordic country records (Finland, Sweden, Norway) with names, capitals, populations, and flags.
2. **Rejected Request Fixture (`FIXTURE_REJECTED_ERROR`):**
   - HTTP 503 Service Unavailable simulated failure.
3. **Retry Success Fixture (`FIXTURE_RETRY_DATA`):**
   - Attempt 1: HTTP 504 Gateway Timeout.
   - Attempt 2 (on Retry): HTTP 200 OK with 2 country records (Denmark, Iceland).

## Injected Dependencies & Isolation
- **Network Injection:** `fetchAdapter` is injected via component props; no hardcoded global API calls are made.
- **Time Injection:** `timeAdapter` supplies configurable deterministic clock (`now()`) and zero-latency simulated delay (`delay()`).
- **Audit Storage Injection:** State transitions are recorded into an in-memory audit log.

## Expected vs Actual Results Table Across Operations

| Step | Scenario | Action | Expected Status | Actual Status | Expected Attempts | Actual Attempts | Expected Count | Actual Count | Status |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Scenario 200 | Mount (200 OK) | success | success | 1 | 1 | 3 | 3 | **PASS** |
| 2 | Scenario Rejected | Switch to Rejected (503) | error | error | 1 | 1 | 0 | 0 | **PASS** |
| 3 | Scenario Retry | Switch to Retry-Success (504) | error | error | 1 | 1 | 0 | 0 | **PASS** |
| 4 | Scenario Retry | Click Retry (200 OK) | success | success | 2 | 2 | 2 | 2 | **PASS** |
| 5 | Reset | Reset to 200 OK | success | success | 1 | 1 | 3 | 3 | **PASS** |

## Agreement Between Two Isolated Runs
- **Run 1 Steps Completed:** 5
- **Run 2 Steps Completed:** 5
- **Deep Strict Equality Assertion:** `assert.deepStrictEqual(run1Trace, run2Trace)` returned **TRUE**.
- **Conclusion:** Both isolated runs executed in fresh browser contexts and produced 100% identical outputs and state transitions.

## Network & Console Integrity
- **Live External Requests:** `0` (Tests make no live API calls)
- **Console Errors:** `0`
- **Page Errors:** `0`
- **Request Failures:** `0`

## Negative / Mutant Testing
A mutant verification test was conducted by temporarily altering the expected status code and injecting a live external URL into the fetch adapter.
- **Result:** The assertion immediately triggered an `AssertionError` (`Expected status success, got ...`), cleanly shut down both browser and server resources, and terminated with non-zero exit code `1`.
- Reverting the mutation confirmed that the test suite cleanly and consistently exits with code `0`.

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Chromium:** `131.0.6778.33`

## Test Execution Details
- **Command:** `node 14_Day_Component_Life_Cycles/applied-labs/r19-t045/check.mjs`
- **Exit Code:** `0`
- **Result:** **PASSED**
