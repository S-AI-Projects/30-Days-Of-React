# Evidence: R19-T050 Fixture-Backed Task Board Lab

## Overview
- **Task ID:** R19-T050
- **URN:** e26b07f0587
- **Branch:** `R19-T050` (and `student/e26b07f0587/R19-T050`)
- **Goal:** Build a fixture-backed task board with add, complete and filter actions plus accessible feedback. Add two tasks, complete one, filter completed: exactly one remains; invalid blank tasks are rejected.
- **Contribution Focus:** Implement the required behavior from the explicit contract; show the smallest useful complete example.

## Explicit Contract & Guarantees
1. **Fixture-Backed State:**
   The component initializes from an immutable input fixture (`DEFAULT_TASKS_FIXTURE` or custom initial prop) and maintains deterministic task items (`{ id, title, completed }`).
2. **Add & Complete Actions:**
   - `addTask`: Appends valid tasks, increments count, and clears input.
   - `toggleTask`: Flips completion status and updates quantitative counters.
3. **Filter Action & Filtering Invariant:**
   - Active filter partitions visible tasks: `all`, `active`, or `completed`.
   - Adding two tasks and completing one partitions the set into exactly 1 completed and 1 active task.
   - Filtering by `completed` displays **exactly one remaining task**.
4. **Accessible Feedback & Blank Task Rejection:**
   - Empty or whitespace-only task titles are rejected with immediate screen-reader feedback (`role="alert"`, `aria-live="assertive"`) and `aria-invalid="true"`.
   - Successful actions are announced through an accessible live status region (`role="status"`, `aria-live="polite"`).
5. **Smallest Useful Complete Example:**
   Pure idiomatic React, minimal component architecture, zero heavy external state dependencies.

## Expected vs Actual Verification Steps

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|:---:|:---|:---|:---|:---|:---:|
| 1 | Initial Mount & Fixture Verification | `Mount fresh component with default fixture` | total=0, active=0, completed=0, aria-invalid=false, role=status | total=0, active=0, completed=0, aria-invalid=false, role=status | **PASS** |
| 2 | Add First Task | `Submit task: "Synthesize React fundamentals"` | total=1, active=1, completed=0, feedback="Task "Synthesize React fundamentals" added." | total=1, feedback="Task "Synthesize React fundamentals" added." | **PASS** |
| 3 | Add Second Task (Two tasks added) | `Submit task: "Deliver final capstone project"` | total=2, active=2, completed=0, feedback="Task "Deliver final capstone project" added." | total=2, feedback="Task "Deliver final capstone project" added." | **PASS** |
| 4 | Complete One Task | `Toggle complete on first task "Synthesize React fundamentals"` | total=2, active=1, completed=1, feedback="Task "Synthesize React fundamentals" marked as completed." | active=1, completed=1, feedback="Task "Synthesize React fundamentals" marked as completed." | **PASS** |
| 5 | Filter Completed (Contract: Exactly One Remains) | `Click filter "Completed"` | exactly 1 visible task remaining ("Synthesize React fundamentals") | visibleCount=1, itemCount=1, title="Synthesize React fundamentals" | **PASS** |
| 6 | Filter Active | `Click filter "Active"` | exactly 1 visible active task ("Deliver final capstone project") | visibleCount=1, title="Deliver final capstone project" | **PASS** |
| 7 | Filter All | `Click filter "All"` | visibleCount=2, all items present | visibleCount=2, 2 task items in list | **PASS** |
| 8 | Rejection of Invalid Blank Task (Empty String "") | `Attempt to submit empty string` | rejected, total=2, aria-invalid=true, role=alert, feedback="Error: Task title cannot be blank." | total=2, aria-invalid=true, role=alert, feedback="Error: Task title cannot be blank." | **PASS** |
| 9 | Rejection of Invalid Blank Task (Whitespace Only "   ") | `Attempt to submit whitespace string` | rejected, total=2, aria-invalid=true, role=alert | total=2, aria-invalid=true, feedback="Error: Task title cannot be blank." | **PASS** |
| 10 | Contribution Focus: Contract Recovery & Reset to Fixture | `Valid submission resets error; Reset button restores initial fixture` | total=0, aria-invalid=false, feedback="Task board reset to initial fixture." | total=0, aria-invalid=false, reset verified | **PASS** |
| 11 | Runtime Health & Zero Error Audit | `Inspect console messages, page errors, and network request failures` | 0 console errors, 0 page errors, 0 request failures | consoleErrors=0, pageErrors=0, requestFailures=0 | **PASS** |

## Accessibility & Live Region Audit
- **Status region (`role="status"`, `aria-live="polite"`):** Verified on initial mount, task addition, task completion, and filter change.
- **Alert region (`role="alert"`, `aria-live="assertive"`):** Verified on rejection of empty string and whitespace-only string.
- **Input validation (`aria-invalid`):** `false` when valid, switches to `true` on rejection, recovers to `false` on valid input.
- **Semantic filter controls:** Filter buttons toggle `aria-pressed="true"` / `"false"`.

## Runtime Error & Isolation Audit
- External / live network requests: `0`
- Unhandled console errors: `0`
- Unhandled page errors: `0`
- Request failures: `0`

## Test Execution Details
- **Test Command:** `node 30_conclusions/applied-labs/r19-t050/check.mjs`
- **Tests Executed:** `11`
- **Exit Code:** `0`
- **Overall Result:** **PASSED**

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Playwright Test:** `1.49.1`
- **Chromium:** `131.0.6778.33`
