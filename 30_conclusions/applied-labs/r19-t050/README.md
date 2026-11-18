# Day 30 Applied Lab: Fixture-Backed Task Board (R19-T050)

## Overview
- **Day Lesson:** [Day 30: Conclusions](../../30_conclusions.md)
- **Task ID:** R19-T050
- **Contract:** Build a fixture-backed task board with add, complete, and filter actions plus accessible feedback. Add two tasks, complete one, filter completed: exactly one remains; invalid blank tasks are rejected.
- **Contribution Focus:** Implement the required behavior from the explicit contract; show the smallest useful complete example.

## Architectural Design & Contract Guarantees

### 1. Fixture-Backed State Initialization
The task board accepts an `initialTasks` prop, defaulting to `DEFAULT_TASKS_FIXTURE` (`[]`). It enables deterministic initialization and testability without any external network calls or database dependencies.

### 2. Actions
- **Add Task:** Controlled text input (`data-testid="task-input"`). Submitting appends a new item `{ id, title, completed: false }` to the task list, resets the input, and clears any validation errors.
- **Complete Task:** Checkbox toggle (`data-testid="task-toggle"`) flips the completion state (`completed: true | false`) and updates active/completed counts.
- **Filter Tasks:** Filter buttons (`All`, `Active`, `Completed`) switch the visible slice of tasks.
  - Invariant: When two tasks are added and one is marked completed, selecting the `Completed` filter guarantees that **exactly one task remains visible**.
- **Reset to Fixture:** Restores the task board to the original fixture state.

### 3. Accessible Feedback
- **Polite Live Status Region (`role="status"`, `aria-live="polite"`):** Announces successful actions (e.g., adding a task, toggling completion, switching filters).
- **Assertive Live Alert Region (`role="alert"`, `aria-live="assertive"`):** Immediately alerts users and screen readers when an invalid blank task is submitted.
- **Input Accessibility:** The input indicates invalid state with `aria-invalid="true"` and links to the live feedback container via `aria-describedby="feedback-region"`.

### 4. Contribution Focus: Smallest Useful Complete Example
The implementation in `example.jsx` adheres strictly to the contract with zero superfluous abstractions:
- Pure React with `useState`.
- Zero external UI libraries or state stores.
- Clean, semantic HTML (`form`, `input`, `button`, `ul`, `li`, `role="status"` / `role="alert"`).
- Full accessibility support baked into the primary workflow.

## Verification & Checks
Run the self-contained verification suite from the repository root:
```bash
node 30_conclusions/applied-labs/r19-t050/check.mjs
```

### What `check.mjs` verifies:
1. Fresh Vite server launch and Chromium browser session.
2. Initial mount verification against fixture defaults.
3. Adding first task ("Synthesize React fundamentals") and verifying state & accessible feedback.
4. Adding second task ("Deliver final capstone project") and verifying list expansion.
5. Completing the first task and verifying count partitions.
6. Filtering by `Completed`: asserts that **exactly one remains visible**.
7. Filtering by `Active`: asserts that exactly one active task remains visible.
8. Filtering by `All`: asserts full set visibility.
9. Submitting empty string (`""`): rejects creation, asserts task count is unchanged, asserts `role="alert"` and `aria-invalid="true"`.
10. Submitting whitespace-only string (`"   "`): rejects creation with accessible feedback.
11. Input recovery and reset action back to initial fixture.
12. Zero console errors, zero page errors, and zero failed network requests.
