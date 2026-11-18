# Evidence: R19-T049 Injected Fetch Adapter with Loading/Error/Retry States

## Overview
- **Task ID:** R19-T049
- **URN:** e26b07f0587
- **Branch:** `R19-T049` (and `student/e26b07f0587/R19-T049`)
- **Goal:** Use an injected fetch adapter with loading/error/retry states. Fixtures cover 200, rejected request and retry success; tests make no live API call.
- **Contribution Focus:** Create a temporary one-line mutant of the decisive condition; add a focused test that passes on the correct example and fails on that mutant.

## Input Records & Fixtures
The lab receives deterministic frozen local fixtures simulating country records:
```json
[
  {
    "id": 1,
    "name": "Finland",
    "capital": "Helsinki",
    "population": 5540720,
    "flag": "🇫🇮"
  },
  {
    "id": 2,
    "name": "Sweden",
    "capital": "Stockholm",
    "population": 10353442,
    "flag": "🇸🇪"
  },
  {
    "id": 3,
    "name": "Norway",
    "capital": "Oslo",
    "population": 5421241,
    "flag": "🇳🇴"
  }
]
```

## Injected Adapter Contracts
1. **200 OK Adapter:** Resolves `{ ok: true, status: 200, statusText: 'OK', json: async () => countries }`
2. **Rejected Request Adapter:** Rejects with `new Error('Network error: Request failed to connect')`
3. **Retry Success Adapter:** Rejects on attempt 1, resolves 200 OK on attempt 2

## Contribution Focus: Decisive Condition & Mutation Verification
### Decisive Condition
```javascript
// DECISIVE CONDITION (Line under mutation testing):
return Boolean(response && response.ok && response.status === 200);
```

### Temporary One-Line Mutant
```javascript
// ONE-LINE MUTANT:
return Boolean(response && !response.ok);
```

### Focused Test Behavior
- **Correct Implementation:** Given an HTTP 200 OK response, the decisive condition returns `true`, component enters `status === 'success'`, item count is `3`, error is `null`. **PASSES**.
- **Mutant Implementation:** The condition inverts `ok` (`!response.ok`), so HTTP 200 evaluates to `false`, transitioning the component to `status === 'error'` with message `"HTTP Error 200: Request failed"`. **FAILS**.

## Expected vs Actual Results Across Operations

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|------|----------|--------|-----------------|---------------|--------|
| 1 | 200 OK Adapter: Mount component, transition from loading to success, display 3 countries | `Mount with 200 Adapter` | status: success, count: 3, error: null | status: success, count: 3, error: null | **PASS** |
| 2 | Rejected Request Adapter: Mount component, catch error, transition to error state with retry button | `Select Rejected Request Scenario` | status: error, error visible, retry button enabled | status: error, message: "Network error: Request failed to connect", retry button visible | **PASS** |
| 3 | Retry Success Adapter: Attempt 1 fails, click retry, attempt 2 resolves 200 OK success | `Retry Recovery Scenario` | attempt 1: error -> retry -> attempt 2: success (count 3) | attempt 1: error ("timeout on attempt 1") -> clicked retry -> attempt 2: success (count: 3) | **PASS** |
| 4 | Contribution Focus (Correct): Focused test verifies 200 OK passes decisive condition into success state | `Run Focused Test (Correct Code)` | decisive condition = true, status: success | decisive condition = true, status: success, count: 3 | **PASS** |
| 5 | Contribution Focus (Mutant): Verify inverted mutant condition rejects 200 OK into error state | `Run Focused Mutant Test` | mutant decisive condition = false, status: error | mutant decisive condition = false, status: error, message: "HTTP Error 200: OK" | **PASS** |
| 6 | Test Isolation & Cleanliness: 0 live API calls, 0 console errors, 0 page errors | `Audit Requests & Console` | 0 live API calls, 0 console errors, 0 page errors | live API calls: 0, console errors: 0, page errors: 0 | **PASS** |

## Network & Console Error Audit
- External/Live API calls: `0` (Isolated local fixtures)
- Console errors: `0`
- Page errors: `0`
- Request failures: `0`

## Test Execution Details
- **Exact Test Command:** `node 14_Day_Component_Life_Cycles/applied-labs/r19-t049/check.mjs`
- **Exit Code:** `0`
- **Overall Result:** **PASSED**

## Negative / Mutant Testing Execution
A code-level mutant test was executed by temporarily editing `example.jsx` to apply the one-line mutant:
```diff
-  return Boolean(response && response.ok && response.status === 200);
+  return Boolean(response && !response.ok);
```
- **Result:** Running `node 14_Day_Component_Life_Cycles/applied-labs/r19-t049/check.mjs` failed at Step 1 and Step 4 with non-zero exit code (`1`), proving that the test suite detects and rejects the mutant.
- The mutant was reverted to the correct condition, and regression testing completed with exit code `0`.

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Playwright Test:** `1.49.1`
- **Chromium:** `131.0.6778.33`
