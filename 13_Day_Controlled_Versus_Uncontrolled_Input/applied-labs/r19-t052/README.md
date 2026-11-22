# R19-T052: Day 13 Lifecycle Request Cleanup (Added Activity)

A focused React applied lab demonstrating asynchronous request cancellation, boundary condition handling, and unmount cleanup. This is an added activity, not an original numbered exercise. All data is local with no live APIs.

## The Contract
- Handles injected delayed requests and avoids stale overwrites across parameter changes.
- A slow response for parameter A (e.g., 250ms) cannot overwrite a newer response for parameter B (e.g., 50ms).
- When the component unmounts while a request is in flight, no post-unmount state updates or memory leak warnings occur.

## Contribution Focus: Boundary Handling & Exact Boundary Conditions
- Strictly guards empty and whitespace-only inputs: sets state to `idle` with `"Enter a valid query"` without dispatching an asynchronous request.
- The effect cleanup sets an active flag `isMounted = false`, discarding outdated promise resolutions.

## Automated Check
From the repository root:
```bash
node 13_Day_Controlled_Versus_Uncontrolled_Input/applied-labs/r19-t052/check.mjs
```
The check runs Playwright assertions to verify empty-input boundary handling, rapid parameter switching race conditions, unmount cleanup, and absence of console errors. Results are saved to `work/R19-T052/results.json`.
