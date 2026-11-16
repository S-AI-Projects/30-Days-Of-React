# R19-T037 evidence — Day 11 contact form (executable lesson example)

## Inputs

A labelled form with name and email fields and inline validation.
Blank name or invalid email blocks submit (the button is disabled
until the form is valid); valid data produces one normalized payload:
name trimmed, email trimmed and lowercased. The README carries the
worked explanation from input through intermediate state to output.

## Expected vs actual

| Step | Input | Expected | Actual |
| --- | --- | --- | --- |
| 1 | blank form | submit disabled, no payload | submit disabled, no payload |
| 2 | name `Ada`, email `not-an-email` | `Enter a valid email address.` inline, submit disabled, no payload | same |
| 3 | email fixed to `ada@example.com` | error clears, submit enabled | same |
| 4 | name `  Ada Lovelace  `, email `ADA@Example.COM`, submit | payload `{"name":"Ada Lovelace","email":"ada@example.com"}` | same |
| 5 | edit email after submit | payload cleared | same |
| 6 | name cleared | `Name is required.` inline, submit disabled | same |

## Check command

From the repository root:

```
node 11_Day_Events/applied-labs/r19-t037/check.mjs
```

Result: **13/13 pass, exit 0, no console or page errors**.

## Negative test

Mutant: the email normalization dropped `.toLowerCase()`, so the
payload kept the typed casing. The same check then exits 1 with
exactly 1 failure ("valid submit produces the normalized payload").
The mutant was reverted after the test.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
