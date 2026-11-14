# R19-T008 — Day 30: Conclusions — Task Board Failure and Recovery Lab

## Overview

This applied lab exercises a small task board that supports adding tasks, completing or undoing them, and filtering by all, active, or completed items. The key contract is that blank tasks are rejected and the user can continue normally on the next valid input.

## Behavioural Contract

| Action | Expected behaviour |
|---|---|
| Blank add | Shows `Task cannot be blank.` and does not add a new task |
| Valid add after a blank | Adds the task normally and clears the error |
| Complete toggle | Marks a task as completed or active again |
| Filter buttons | Show only the matching subset of tasks |

## Implementation Notes

- The `newTask` field is trimmed before insertion.
- Blank values are rejected with a visible error message.
- Valid tasks are appended without mutating or resetting unrelated state.
- Filters are derived from task completion status and do not affect task persistence.
- No timers, random values, or live APIs are used.

## Usage

```bash
# From the repository root
node 30_conclusions/applied-labs/r19-t008/check.mjs
```

## File Structure

```text
30_conclusions/applied-labs/r19-t008/
├── example.jsx   — React task-board component
├── check.mjs     — Playwright verification script
├── package.json  — React 18 + Playwright configuration
├── README.md     — Lab contract and invariants
```

## Invariants

1. A blank task click shows the blank-task validation message.
2. The task list count does not change after a rejected blank submission.
3. A valid input adds exactly one task and clears the validation message.
4. Completing a task toggles its state and updates the filter view.
5. Zero console errors and zero unhandled page errors.
