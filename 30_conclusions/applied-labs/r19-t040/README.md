# Tasks — Day 30 applied lab (R19-T040)

A fixture-backed task board with add, complete and filter actions
plus accessible feedback. Add two tasks, complete one, filter
completed: exactly one remains; blank tasks are rejected.

## Expected result

| Step | Result |
| --- | --- |
| Board loads | `No tasks.` |
| Add with an empty input | No task added; feedback `Task title is required.` |
| Add with spaces only | No task added |
| Add `Buy milk`, then `Read chapter 3` | 2 tasks; feedback `Task added.` |
| Complete `Buy milk` | Row marked done; feedback `Task completed.` |
| Filter Completed | Exactly 1 task: `Buy milk` |
| Filter Active | Exactly 1 task: `Read chapter 3` |
| Filter All | 2 tasks |

Feedback is announced through a `role="status"` live region
(`aria-live="polite"`), so it is readable by assistive technology.

## The decisive condition and its mutant

The filter lives in one place, `visibleTasks` in `example.jsx`:

```js
if (filter === 'completed') return tasks.filter((t) => t.done);
```

The focused test is the completed-filter assertion in `check.mjs`:
after adding both fixture tasks and completing the first, the
completed filter must show exactly one task, and it must be the
completed one. A temporary one-line mutant — flipping `t.done` to
`!t.done` in that branch — makes the check exit 1 with exactly 2
failures (the completed filter then shows the uncompleted task). The
mutant was reverted after the test; the shipped code carries the
correct condition.

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 30_conclusions/applied-labs/r19-t040/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
