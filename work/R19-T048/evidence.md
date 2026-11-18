# Evidence: R19-T048 useState Functional Updates Counter Lab

## Overview
- **Task ID:** R19-T048
- **URN:** e26b07f0587
- **Branch:** `R19-T048` (and `student/e26b07f0587/R19-T048`)
- **Goal:** Implement a counter with `useState` functional updates and a reset action. Two queued increments produce +2; reset restores the initial prop value.
- **Contribution Focus:** Check three bounded input sizes or repeated interaction counts; assert correctness and report operation counts or render/listener counts rather than imposing a speed threshold.

## Stated Contract & Mathematical Invariants
1. **Queued Increments Invariant:**
   Calling `setCount(prev => prev + 1)` twice in the same handler queues two state updates in React's fiber queue:
   $$\text{Count}_{t+1} = \text{Count}_t + 1 + 1 = \text{Count}_t + 2$$
2. **Reset Invariant:**
   $$\text{Count}_{\text{reset}} \equiv \text{InitialProp}$$
3. **Bounded Interaction Sequences ($N$ iterations of double increments):**
   $$\text{Count}(N) = \text{InitialProp} + 2N$$

## Bounded Interaction Input Sizes Checked
| Size Label | Iterations ($N$) | Queued Functional Updates ($2N$) | Expected Delta | Expected Output (from base 10) |
|:---|:---:|:---:|:---:|:---:|
| **Small** | 5 | 10 | +10 | 20 |
| **Medium** | 25 | 50 | +50 | 60 |
| **Large** | 100 | 200 | +200 | 210 |

## Expected vs Actual Verification Steps

| Step | Scenario | Action | Expected Output | Actual Output | Reported Metrics | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | Initial mount state | `Mount` | count=10, initial=10 | count=10, initial=10 | renders: 2, ops: 0, listeners: 0 | **PASS** |
| 2 | Queued double increment (+2) | `Click Queued +2` | count=12 (+2 from 10) | count=12 | renders: 3, ops: 1, listeners: 1 | **PASS** |
| 3 | Reset restores initial prop | `Click Reset` | count=10 | count=10 | renders: 4, ops: 2, listeners: 2 | **PASS** |
| 4 | Bounded Size 1 (Small: N=5 double increments, delta=+10) | `Batch Small + Reset` | count=20 then reset to 10 | count=20 then reset to 10 | renders: 6, ops: 4, listeners: 4 | **PASS** |
| 5 | Bounded Size 2 (Medium: N=25 double increments, delta=+50) | `Batch Medium + Reset` | count=60 then reset to 10 | count=60 then reset to 10 | renders: 8, ops: 6, listeners: 6 | **PASS** |
| 6 | Bounded Size 3 (Large: N=100 double increments, delta=+200) | `Batch Large + Reset` | count=210 then reset to 10 | count=210 then reset to 10 | renders: 10, ops: 8, listeners: 8 | **PASS** |
| 7 | Sequential repeated UI clicks (3x double + 1x single + reset) | `Sequential Clicks + Reset` | count=17 then reset to 10 | count reached 17 then reset to 10 | renders: 15, ops: 13, listeners: 13 | **PASS** |
| 8 | Reconfigurable Initial Prop Contract (initialCount = 42) | `Change Prop -> Queued +2 -> Reset` | count=44 then reset to 42 | count=42 (restored to 42) | renders: 20, ops: 15, listeners: 15 | **PASS** |
| 9 | Console & Page Error Cleanliness | `Assert 0 errors` | consoleErrors=0, pageErrors=0, requestFailures=0 | consoleErrors=0, pageErrors=0, requestFailures=0 | renders: -, ops: -, listeners: - | **PASS** |

## Contribution Focus: Reported Operation & Render Diagnostics
*Note: Correctness is mathematically asserted; metrics below are reported rather than constrained by flaky speed thresholds.*

- **Total Renders Observed Across Test Suite:** 20
- **Total Operations Dispatched:** 15
- **Total DOM Event Listeners Invocations:** 15
- **Total Functional Updaters Executed:** 271

## Console & Page Error Summary
- Console errors: `0`
- Page errors: `0`
- Failed network requests: `0`

## Test Execution Details
- **Exact Command:** `node 21_Introducing_Hooks/applied-labs/r19-t048/check.mjs`
- **Exit Code:** `0`
- **Overall Result:** **PASSED**

## Negative / Mutant Testing Verification
A mutant test was conducted by temporarily modifying `example.jsx` to use direct stale-closure updates:
```javascript
// Mutant non-functional updates (stale closure):
setCount(count + 1);
setCount(count + 1);
```
- **Result:** Check immediately failed at Step 2 (`Two queued increments must produce +2 (expected 12, got 11)`) and exited with non-zero exit code `1`.
- The functional update implementation was restored, and all checks cleanly passed with exit code `0`.

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Chromium:** `131.0.6778.33`
