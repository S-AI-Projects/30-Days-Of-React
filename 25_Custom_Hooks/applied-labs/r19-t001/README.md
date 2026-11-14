# Applied Lab R19-T001: Custom Hook `useToggle` State Isolation

## Objective
Demonstrate reusable state abstraction using the `useToggle` custom hook, proving state isolation across multiple independent panels, along with explicit boolean setters and reset capabilities.

## Contract
`useToggle(initialValue = false)` returns a stable tuple and action object:
* `value` (`boolean`): The current toggle state.
* `toggle()` (`function`): Inverts boolean value (`!prev`). Reference remains stable across re-renders.
* `set(nextValue)` (`function`): Explicitly updates the state to `Boolean(nextValue)`.
* `reset()` (`function`): Resets state back to `initialValue`.
* Convenience helpers: `setTrue()`, `setFalse()`.

## Component Structure
The lab provides:
* `useToggle`: The custom hook with stable callbacks (`useCallback`).
* `TogglePanel`: An independent panel with controls (`Toggle`, `Set True`, `Set False`, `Reset`) and a status badge.
* `App`: Renders two independent panels (`Panel A` and `Panel B`) side by side.

## Invariant Verification
1. Toggling **Panel A** changes its status between `ON` and `OFF` without modifying **Panel B**.
2. Explicit `Set True` / `Set False` / `Reset` actions operate strictly on their scoped panel.
3. Function references for action handlers are stable across renders.

## Running the Automated Checks
Ensure local dependencies are installed, then execute:
```bash
node 25_Custom_Hooks/applied-labs/r19-t001/check.mjs
```
The check runs Playwright assertions against a locally served instance, verifies all contract conditions, checks for console cleanlines, and exits with code `0`.

