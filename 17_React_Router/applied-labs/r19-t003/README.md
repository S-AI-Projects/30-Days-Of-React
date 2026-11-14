# Applied Lab R19-T003: Route Behavior & Reference Comparison

## Objective
Demonstrate declarative routing behavior with local state and browser History API integration, covering Home, Detail, and Not-Found routes, browser Back/Forward navigation, and validating rendered views against an independent reference truth table.

## Expected-Result Reference Table
The route contract is verified against this deterministic reference model:

| Route Path | Expected View | Expected Heading | Expected Content Summary |
| :--- | :---: | :--- | :--- |
| `/` | `home` | Course Topics | Topic listing with accessible links |
| `/item/1` | `detail` | React Basics | Core components and props fundamentals |
| `/item/2` | `detail` | State Management | Interactive hooks and state updates |
| `/item/3` | `detail` | Routing Patterns | Declarative routing and navigation history |
| `/item/999` | `not-found` | Not Found | Topic with ID "999" was not found |
| `/unknown` | `not-found` | Not Found | The requested route does not exist |

## Invariants Verified
1. **Known ID Route**: Navigating to `/item/1` displays the title and description for Item 1.
2. **Unknown ID Route**: Navigating to `/item/999` or `/unknown` renders the accessible 404 Not Found view.
3. **Browser History Navigation**: Navigating from Home (`/`) to `/item/1` and triggering browser Back (`page.goBack()`) cleanly restores the Home view.
4. **Reference Comparison**: Every rendered route view is asserted to match the corresponding entry in `ROUTE_REFERENCE_TABLE`.

## Running the Automated Checks
```bash
node 17_React_Router/applied-labs/r19-t003/check.mjs
```
The automated check serves the app, launches Chromium, walks through all test paths and browser Back events, asserts exact alignment with the reference table, checks for clean console output, and saves evidence to `work/R19-T003/`.
