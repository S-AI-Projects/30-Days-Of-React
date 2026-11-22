# R19-T058: Day 20 Cat Gallery Failure Recovery (Added Activity)

A focused React applied lab demonstrating pagination, failure handling, retry recovery, and stale response rejection in a fixture-backed cat gallery. This is an added activity, not an original numbered exercise. All data is local with no external live APIs.

## The Contract
- **Pagination:** Navigating between pages replaces records with the target page's cats.
- **Failure & Recovery:** An initial page failure renders an explicit error view with a retry control; clicking Retry recovers and renders the cats without restarting the app.
- **Stale Response Prevention:** Slower in-flight requests from a superseded page cannot overwrite the current active page.

## Contribution Focus: Demonstrated Failure and In-Session Recovery
- Shows an explicit error state (`status: error` with `"Failed to load page 2 cats."`) upon navigating to Page 2.
- Demonstrates immediate, seamless recovery upon clicking the Retry button without reloading the browser or resetting application state.

## Automated Check
From the repository root:
```bash
node 20_projects/applied-labs/r19-t058/check.mjs
```
The check runs Playwright assertions to verify initial page data, failure injection, in-session retry recovery, and stale response prevention. Results are saved to `work/R19-T058/results.json`.
