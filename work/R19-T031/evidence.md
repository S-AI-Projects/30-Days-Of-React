# R19-T031 — evidence

Task: R19-T031, Day 24 hook composition (issue #4).
Check: `node 24_projects/applied-labs/r19-t031/check.mjs` from the repository root.

## Inputs exercised

1. Fresh load — empty form.
2. Name `Ada Lovelace`, email `not-an-email`, then blur the email field.
3. Email corrected to `ada@example.com`.
4. Submit while valid.
5. Reset.
6. Submit while empty.

## Expected vs actual — 20/20 passed

| # | Expected | Actual |
|---|----------|--------|
| 1 | Fresh load: form is invalid | ok |
| 2 | Fresh load: summary is empty | ok |
| 3 | Fresh load: no name error shown | ok |
| 4 | Fresh load: no email error shown | ok |
| 5 | Invalid email shows `Enter an email like ada@example.com.` | ok |
| 6 | Invalid email: form is still invalid | ok |
| 7 | Fixed email: error clears | ok |
| 8 | Fixed email: form is valid | ok |
| 9 | Summary derives `Ada Lovelace — ada@example.com` | ok |
| 10 | Valid submit shows `Profile saved.` | ok |
| 11 | Reset: name is empty | ok |
| 12 | Reset: email is empty | ok |
| 13 | Reset: form is invalid again | ok |
| 14 | Reset: summary is empty again | ok |
| 15 | Reset: success message is gone | ok |
| 16 | Empty submit: name error `Name is required.` | ok |
| 17 | Empty submit: email error `Email is required.` | ok |
| 18 | Empty submit: no success message | ok |
| 19 | No page errors (got 0) | ok |
| 20 | No console errors (got 0) | ok |

Exit code: 0 — `all checks passed`.

## Negative test

A temporary mutant made `validateEmail` accept any non-empty value
(invalid emails pass). The same check then exited 1 with 2 failures
(`invalid email shows its error`, `invalid email: form is still invalid`),
so the check rejects a broken contract instead of passing it.

## Tool versions

Verified 2026-11-15 on Gooby's VM. Re-run on the Mac with the command
above and keep that output as the final evidence.

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1
- vite 5.4.8, @vitejs/plugin-react 4.3.4
- playwright 1.49.1
- Chromium 131.0.6778.33 (Playwright build 1148)
