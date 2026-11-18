# Evidence: R19-T047 Theme Context & Nested Consumer with Subtree Isolation

## Overview
- **Task ID:** R19-T047
- **URN:** e26b07f0587
- **Branch:** `R19-T047` (and `student/e26b07f0587/R19-T047`)
- **Goal:** Provide a theme context with a toggle and a nested consumer. Toggling changes all consumers inside the provider; an independently provided subtree keeps its own state.
- **Contribution Focus:** Demonstrate the stated error or empty state, then a successful recovery on the next valid input without restarting the example.

## Core Contract & Behavioral Invariants
1. **Context Propagation Invariant:**
   All consumers (both direct and deeply nested) wrapped inside the main `ThemeProvider` receive the current theme without intermediate prop-drilling:
   $$\text{ConsumerTheme}_i \equiv \text{ProviderState}(\text{Theme})$$
2. **Subtree Isolation Invariant:**
   An independently provided subtree wrapped in its own separate `ThemeProvider` maintains its own isolated theme state:
   $$\text{SubtreeTheme} \perp \text{MainProviderTheme}$$
   Toggling the main provider leaves the independent subtree untouched; toggling the independent subtree leaves the main provider untouched.
3. **Empty / Error State & In-Place Recovery Invariant:**
   Supplying an invalid or empty theme input transitions the context into the stated error / empty state without crashing or restarting:
   $$\text{Input} = \emptyset \implies \text{State} = \text{EmptyFallback} \land \text{ErrorBanner} = \text{Visible}$$
   On the very next valid input, the context recovers in-place within the same running session:
   $$\text{Input} = \text{ValidTheme} \implies \text{State} = \text{ValidTheme} \land \text{ErrorBanner} = \emptyset$$

## Verification Steps Summary

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|:---:|:---|:---|:---|:---|:---:|
| 1 | Initial Mount State | `Mount` | main=light (direct & nested), independent=dark (direct & nested), orphan=fallback, errors=0 | main=light, independent=dark, orphan=fallback, errors=0 | **PASS** |
| 2 | Main Provider Toggle to Dark | `Click [data-testid="toggle-main-theme"]` | main consumers (direct & nested) become "dark"; independent subtree retains "dark" | mainDirect=dark, mainNested=dark, indepDirect=dark | **PASS** |
| 3 | Independent Subtree Toggle to Light | `Click [data-testid="toggle-independent-theme"]` | independent subtree consumers become "light"; main consumers remain "dark" | indepDirect=light, indepNested=light, mainDirect=dark | **PASS** |
| 4 | Main Provider Toggle Back to Light | `Click [data-testid="toggle-main-theme"]` | main consumers become "light"; independent subtree remains "light" | mainDirect=light, mainNested=light, indepDirect=light | **PASS** |
| 5 | Demonstrate Stated Empty State | `Click [data-testid="clear-theme-btn"]` | error banner displayed with empty error text, empty state view active, consumers show "fallback-empty" | bannerText="Error: Theme name cannot be empty. Enter a valid theme (light, dark, solarized, ocean).", theme=fallback-empty | **PASS** |
| 6 | Demonstrate Stated Invalid Input Error | `Enter "cyberpunk-neon-invalid" -> Click Apply` | error banner displays unknown theme error message | bannerText="Error: Unknown theme 'cyberpunk-neon-invalid'. Supported themes: light, dark, solarized, ocean." | **PASS** |
| 7 | Successful In-Place Recovery on Valid Input | `Enter "solarized" -> Click Apply (without restarting app)` | error banner removed, empty state removed, consumers updated to "solarized", state=healthy | errorBannerCount=0, mainDirect=solarized, mainNested=solarized, status="Active theme: solarized (Solarized Sand) | State: healthy" | **PASS** |
| 8 | Second Error & Recovery Cycle (Ocean) | `Trigger invalid state -> Enter "ocean" -> Click Apply` | error cleared, consumers updated to "ocean" | error cleared, mainDirect=ocean, mainNested=ocean | **PASS** |
| 9 | Post-Recovery Main Toggle | `Click [data-testid="toggle-main-theme"] after recovery` | main consumers toggle to "dark" | mainDirect=dark, mainNested=dark | **PASS** |
| 10 | Error Log Cleanliness | `Inspect console, pageerror, requestfailed events` | consoleErrors=0, pageErrors=0, requestFailures=0 | consoleErrors=0, pageErrors=0, requestFailures=0 | **PASS** |

## Console, Page Error & Network Cleanliness
- Console errors: `0`
- Page errors: `0`
- Failed network requests: `0`

## Test Execution Details
- **Command:** `node 26_Context/applied-labs/r19-t047/check.mjs`
- **Exit Code:** `0`
- **Result:** **PASSED**

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Chromium:** `131.0.6778.33`

## Negative / Mutant Testing Verification
A mutant test was conducted by temporarily modifying `toggleTheme` in `example.jsx` to a no-op handler:
```javascript
const toggleTheme = () => {
  // Mutant test: no-op toggle that breaks toggle synchronization
  console.log('Mutant toggle applied');
};
```
- **Result:** Playwright assertion immediately failed at Test 2 (`Timed out 5000ms waiting for expect(locator).toHaveText("dark")`) and exited with non-zero exit code `1`.
- Restoring the correct context implementation returned all 10 checks to **PASS** with exit code `0`.

