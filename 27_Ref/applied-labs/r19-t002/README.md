# Applied Lab R19-T002: Ref Focus Management & Boundary Lab

## Objective
Demonstrate DOM ref-based focus management in an accessible modal dialog workflow, asserting focus shifting on open/close transitions, isolation of ref mutations from re-renders during text entry, and handling empty/whitespace boundary conditions.

## Contract & Invariants
1. **Focus on Open**: Triggering `Open Dialog` reveals the dialog panel and automatically moves browser focus to `#feedback-input` (`inputRef.current`).
2. **Focus on Close**: Closing the dialog panel restores browser focus to the trigger button `#trigger-btn` (`triggerRef.current`).
3. **Zero Rerender on Typing**: The input is uncontrolled via `useRef`. Normal character typing does not trigger component re-renders.
4. **Boundary Condition (Empty/Whitespace Input)**:
   - Attempting to submit empty or whitespace-only strings is rejected.
   - An explicit error message (`Input cannot be empty. Please provide valid text.`) is displayed.
   - The dialog remains open.
   - Focus is retained on the input element for correction.
5. **Valid Recovery**: Submitting non-empty text commits the entry, dismisses the dialog, and restores focus to the trigger element.

## Running the Automated Check
```bash
node 27_Ref/applied-labs/r19-t002/check.mjs
```
The check runs Playwright assertions against a locally served instance, exercises all boundary and focus invariants, asserts zero console/page errors, and captures verification artifacts in `work/R19-T002/`.
