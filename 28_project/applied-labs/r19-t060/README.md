# R19-T060: Day 28 Deployment Base Paths — Regression-Focused Lab (Added Activity)

A focused React applied lab demonstrating application deployment, routing, and asset resolution beneath a non-root base path (`/course/`). This is an added activity, not an original numbered exercise. All data is local with no live APIs.

## The Contract
- Serves assets and routes beneath `/course/`.
- Local navigation resolves known routes (`/course/`, `/course/lessons`, `/course/about`).
- A browser page refresh (F5/reload) strictly preserves the current route and assets.
- Unregistered routes render a 404 Not Found view.

## Contribution Focus: Decisive Condition Mutant & Focused Test
- **Decisive Condition:**
  ```javascript
  export const BASE_PATH = '/course';
  <BrowserRouter basename={BASE_PATH}>
  ```
- **The One-Line Mutant:**
  ```javascript
  // Mutant: stripping the base path breaks routing under /course/
  export const BASE_PATH = '';
  ```
- **Focused Test:** Navigating and reloading `/course/lessons`.
  - On the **correct implementation**: `page.reload()` retains `/course/lessons` and displays `page-lessons` (`PASS`).
  - On the **mutant**: the router fails to recognize the base path, falls through to `not-found`, and fails the route assertion (`MUTANT KILLED`).

## Automated Check
From the repository root:
```bash
node 28_project/applied-labs/r19-t060/check.mjs
```
The check runs Playwright assertions to verify asset loading, route preservation across page reloads, and proves that the mutant is killed by the focused test while the correct example passes with zero console errors. Results are saved to `work/R19-T060/results.json`.
