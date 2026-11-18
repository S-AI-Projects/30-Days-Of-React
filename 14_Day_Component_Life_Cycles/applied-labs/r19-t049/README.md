# R19-T049: Day 14 Injected Fetch Adapter with Loading/Error/Retry States (Added Activity)

## Learning Objective
Practice and verify React Component Life Cycles (`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`) using an injected fetch adapter pattern.
- Demonstrates handling of **loading**, **error**, and **retry** states during asynchronous data fetching in component lifecycles.
- Replaces unhandled live external API calls from the lesson with deterministic, local mock fixtures.
- Implements test isolation: fixtures cover HTTP 200, rejected requests, and retry recovery without making any live network calls.
- Explores mutation testing via a decisive condition that distinguishes successful fetch responses from errors.

> **Note:** This is an **added activity**, not an original numbered exercise from the lesson.

---

## Local Fixtures & Injected Adapter Contract
All requests are handled locally via adapter functions matching the fetch contract (`Promise<{ ok, status, statusText, json }>`):
1. **200 OK Adapter (`createSuccessAdapter`):**
   Resolves with `{ ok: true, status: 200, statusText: 'OK', json: async () => COUNTRIES_FIXTURE }`.
2. **Rejected Request Adapter (`createRejectedAdapter`):**
   Rejects with `new Error('Network error: Failed to fetch')`.
3. **Retry Success Adapter (`createRetrySuccessAdapter`):**
   Fails on attempt 1 with a rejected promise, and resolves successfully on attempt 2 (retry).

### Deterministic Fixture Records
```javascript
export const COUNTRIES_FIXTURE = Object.freeze([
  Object.freeze({ id: 1, name: 'Finland', capital: 'Helsinki', population: 5540720, flag: '🇫🇮' }),
  Object.freeze({ id: 2, name: 'Sweden', capital: 'Stockholm', population: 10353442, flag: '🇸🇪' }),
  Object.freeze({ id: 3, name: 'Norway', capital: 'Oslo', population: 5421241, flag: '🇳🇴' }),
]);
```

---

## Contribution Focus: Decisive Condition & Mutation Testing
The **decisive condition** evaluates whether an incoming HTTP response represents a valid 200 OK success:

```javascript
// DECISIVE CONDITION (Line under mutation testing):
return Boolean(response && response.ok && response.status === 200);
```

### Temporary One-Line Mutant
Inverting the condition causes valid 200 responses to be rejected as errors:
```javascript
// ONE-LINE MUTANT:
return Boolean(response && !response.ok);
```

### Focused Test Behavior
- **Correct Implementation:** Given a 200 OK response from the injected adapter, the component transitions from `loading` to `success`, renders country list items, and keeps `error` as `null`. **PASSES**.
- **Mutant Implementation:** The decisive condition inverts the check, causing the component to transition to `error` ("HTTP Error 200: Request failed") despite receiving a 200 OK status. **FAILS**.

---

## Setup & Verification

From the lab directory:
```bash
npm install
npm run dev
```

From the **repository root directory**:
```bash
node 14_Day_Component_Life_Cycles/applied-labs/r19-t049/check.mjs
```

The automated check:
1. Boots an isolated Vite local server.
2. Launches Playwright Chromium with zero console/page error tolerance.
3. Tests Scenario 1 (200 OK initial mount & success display).
4. Tests Scenario 2 (Rejected network request & error state with retry button).
5. Tests Scenario 3 (Retry recovery from error back to success).
6. Executes focused decisive condition verification (passes on correct code, fails on mutant).
7. Asserts zero live API calls were dispatched.
8. Writes results to `work/R19-T049/results.json` and `work/R19-T049/evidence.md`.
