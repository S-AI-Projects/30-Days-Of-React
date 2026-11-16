# R19-T040 evidence — Day 30 task board (capstone, regression-focused lab)

## Inputs

Fixture (`fixture.mjs`): add `Buy milk`, then `Read chapter 3`;
complete the first; filter Completed. Blank and whitespace-only
inputs are rejected. Feedback is announced through a `role="status"`
live region (`aria-live="polite"`).

## Expected vs actual (one page session, no reload)

| Step | Expected | Actual |
| --- | --- | --- |
| Board loads | `No tasks.` | same |
| Add with an empty input | no task; feedback `Task title is required.` | same |
| Add with spaces only | no task | same |
| Add both fixture tasks | 2 tasks; feedback `Task added.` | same |
| Complete `Buy milk` | row marked done; feedback `Task completed.` | same |
| Filter Completed | exactly 1 task: `Buy milk`, done | same |
| Filter Active | exactly 1 task: `Read chapter 3` | same |
| Filter All | 2 tasks | same |

## Check command

From the repository root:

```
node 30_conclusions/applied-labs/r19-t040/check.mjs
```

Result: **16/16 pass, exit 0, no console or page errors.**

## Negative test (the contribution focus)

The decisive condition is the completed branch of `visibleTasks` in
`example.jsx`: `tasks.filter((t) => t.done)`. A temporary one-line
mutant flipped it to `!t.done`. The same check then exits 1 with
exactly 2 failures — the two focused completed-filter assertions
(the completed filter showed the uncompleted task instead). The
mutant was reverted after the test; the shipped code carries the
correct condition.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
