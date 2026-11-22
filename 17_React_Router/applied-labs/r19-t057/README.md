# R19-T057: Day 17 Route Behavior Lab (Added Activity)

A focused React applied lab demonstrating client-side routing, route parameters, not-found states, and history navigation. This is an added activity, not an original numbered exercise. All data is local with no live APIs.

## The Contract
- Creates accessible Home, Detail, and Not-Found routes.
- Navigating to a known item ID displays its detailed view (`detail-title` and `detail-desc`).
- Navigating to an unknown item ID displays an explicit "Not found" view.
- Triggering browser Back restores the prior view in history.

## Contribution Focus: Worked Explanation of Route Lifecycle
- **Input:** User navigates to a URL path (e.g. `/items/item-1`, `/items/unknown-999`) or clicks an accessible `<Link>`.
- **Intermediate State:** `react-router-dom` matches the URL pattern against registered `<Route>` configurations. For `/items/:id`, `useParams()` extracts the parameter `{ id }`, which is evaluated against `ITEMS_DATABASE`.
- **Output:**
  - If a record matches: renders `DetailView` with title and description.
  - If no record matches: renders `not-found` state with "Not found".
  - When the browser Back event fires, the history stack pops to the prior location, re-rendering the previous view with zero reloads or console errors.

## Automated Check
From the repository root:
```bash
node 17_React_Router/applied-labs/r19-t057/check.mjs
```
The check runs Playwright assertions to navigate through home, valid detail, not-found, and browser back history, verifying view transitions and 0 console errors. Results are saved to `work/R19-T057/results.json`.
