# Day 21 Applied Lab: useState Functional Updates Counter (R19-T048)

This applied lab demonstrates state management in React functional components using the `useState` hook, focusing on **functional state updates** and a **reset action**.

> **Note:** This is an explicitly specified applied lab added to Day 21 (Introducing Hooks). It does not replace or modify any original numbered exercises.

---

## 1. Goal & Contract Specification

- **Primary Contract:**
  1. **Queued Increments:** Two queued increments called in the same event dispatch produce **+2** to the count:
     ```javascript
     setCount((prev) => prev + 1);
     setCount((prev) => prev + 1);
     ```
  2. **Reset Action:** Invoking the reset action strictly restores the component state to the initial prop value (`initialCount`):
     ```javascript
     setCount(initialCount);
     ```

- **Why Functional Updates Matter:**
  In React, state updates scheduled via `setCount(count + 1)` capture the current closure's value of `count`. If two such updates are queued in the same event tick, both read the identical stale value, resulting in only **+1**. By passing updater functions `(prev) => prev + 1`, React chains the pending updates in its internal fiber update queue: the second updater receives the resolved return value of the first updater, reliably producing **+2**.

---

## 2. Contribution Focus

**"Check three bounded input sizes or repeated interaction counts; assert correctness and report operation counts or render/listener counts rather than imposing a speed threshold."**

1. **Three Bounded Input Sizes / Interaction Counts:**
   - **Small ($N_1 = 5$):** 5 double-increment operations (10 queued functional updates) $\to$ Delta $+10$.
   - **Medium ($N_2 = 25$):** 25 double-increment operations (50 queued functional updates) $\to$ Delta $+50$.
   - **Large ($N_3 = 100$):** 100 double-increment operations (200 queued functional updates) $\to$ Delta $+200$.

2. **Mathematical Correctness Assertions:**
   - State transition invariant:
     $$\text{Count}_t = \text{InitialProp} + \sum_{i=1}^m \Delta_i$$
   - Reset invariant:
     $$\text{Count}_{\text{reset}} \equiv \text{InitialProp}$$
   - Every test verifies exact arithmetic equality without tolerance.

3. **Reporting Diagnostics (No Speed Thresholds):**
   - The test suite and UI track and report:
     - **Render Count:** Total component render cycles observed (`renderCountRef`).
     - **Operation Count:** High-level user interaction dispatches.
     - **Listener Count:** Total DOM click event listener invocations.
     - **Updater Count:** Total functional updater callbacks executed by React.
   - Rather than enforcing arbitrary, flaky wall-clock execution speed thresholds (e.g. `duration < 50ms`), this lab asserts structural correctness and logs concrete operation and render counts.

---

## 3. Directory Layout

```
21_Introducing_Hooks/applied-labs/r19-t048/
├── README.md           # Lab documentation and specifications
├── example.jsx         # Counter implementation with functional updates & diagnostics
├── check.mjs           # Automated Playwright verification suite
├── main.jsx            # React 18 DOM mount entrypoint
├── index.html          # HTML harness
├── package.json        # Dependencies & scripts
├── package-lock.json   # Deterministic lockfile
├── vite.config.js      # Vite build configuration
└── .gitignore          # Ignores node_modules and build artifacts
```

---

## 4. Verification & Testing

Run the automated verification suite from the repository root:

```bash
node 21_Introducing_Hooks/applied-labs/r19-t048/check.mjs
```

The check script:
- Spins up an isolated local Vite development server.
- Launches a headless Playwright Chromium instance.
- Exercises the contract (queued increments $\to +2$, reset $\to \text{initial}$).
- Runs the three bounded interaction counts ($N_1=5, N_2=25, N_3=100$).
- Asserts strict correctness and reports render/listener/operation counts.
- Rejects any console errors, unhandled exceptions, or failed network requests.
- Writes comprehensive results to `work/R19-T048/results.json` and `work/R19-T048/evidence.md`.
