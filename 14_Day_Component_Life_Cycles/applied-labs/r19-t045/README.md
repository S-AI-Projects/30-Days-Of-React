# Day 14 Applied Lab: Injected Fetch Adapter Life Cycle (R19-T045)

## Goal
Use an injected fetch adapter with loading/error/retry states. Fixtures cover 200, rejected request and retry success; tests make no live API call.

## Contribution Focus: Dependency Injection & Agreement Between Isolated Runs
- **Inject Network (`fetchAdapter`)**: The component accepts an injected `fetchAdapter` prop instead of calling unisolated global network endpoints.
- **Inject Time (`timeAdapter`)**: Time delays and timestamp clocks are injectable (`defaultTimeAdapter`, `testTimeAdapter`), eliminating race conditions and ensuring deterministic test execution.
- **Repeatable Local Fixtures**:
  1. **200 OK**: Resolves HTTP 200 with 3 Nordic country records (Finland, Sweden, Norway).
  2. **Rejected Request**: Rejects with HTTP 503 (`Service Unavailable`), triggering the error state and surfacing the retry button.
  3. **Retry Success**: Initial attempt fails with HTTP 504 (`Gateway Timeout`); triggering retry executes attempt 2 which resolves with HTTP 200 and 2 country records (Denmark, Iceland).
- **Agreement Between Two Isolated Runs**:
  The automated Playwright test suite executes two completely isolated runs in distinct browser contexts. Both runs verify all three fixture lifecycles, and a strict deep-equality assertion (`assert.deepStrictEqual(run1Trace, run2Trace)`) confirms 100% agreement between isolated runs.

## Day 14 Alignment: Component Life Cycles
Day 14 teaches React component life cycle phases:
1. **Mounting (`componentDidMount`)**: Initiates asynchronous data fetching via the injected fetch adapter immediately after initial render.
2. **Updating (`componentDidUpdate`)**: Detects prop changes (such as scenario switches or adapter replacements) and triggers lifecycle re-fetching.
3. **Unmounting (`componentWillUnmount`)**: Ensures proper cleanup and prevents state updates on unmounted components.

## Interactive States Contract
- **Loading State**: When a request is in flight, `loading` is `true`, `status` is `'loading'`, and `data-testid="loading-indicator"` is visible.
- **Error State**: When a request fails, `loading` is `false`, `status` is `'error'`, `data-testid="error-message"` displays the error detail, and `data-testid="retry-btn"` is enabled.
- **Retry Action**: Clicking `data-testid="retry-btn"` transitions the component back to loading, increments the attempt count, and re-executes the fetch adapter.
- **Success State**: When resolved, `loading` is `false`, `status` is `'success'`, `data-testid="data-container"` renders the records, and `data-testid="data-count"` displays the exact count.

## Running the Application Locally
```bash
cd 14_Day_Component_Life_Cycles/applied-labs/r19-t045
npm install
npm run dev
```

## Running Verification Checks
From the repository root:
```bash
node 14_Day_Component_Life_Cycles/applied-labs/r19-t045/check.mjs
```
The Playwright check:
- Launches the local Vite server and headless Chromium browser.
- Monitored network traffic confirms 0 live API calls.
- Executes Run 1 across 200 OK, rejected request, and retry success.
- Executes Run 2 in a fresh isolated context.
- Confirms zero console errors and zero page errors.
- Asserts complete agreement between both runs.
- Saves execution evidence and results in `work/R19-T045/`.
