# Contact form — Day 11 applied lab (R19-T037)

A labelled form with name and email fields and inline validation.
Blank name or invalid email blocks submit — the button is disabled
until the form is valid. Valid data produces one normalized payload.

## Worked explanation: input → intermediate state → output

Take one concrete run: the user types `  Ada Lovelace  ` into the
name field and `ADA@Example.COM` into the email field.

1. **Input.** The raw strings sit in the DOM inputs, exactly as typed —
   spaces, capitals and all. Nothing is cleaned up at this point.
2. **Intermediate state.** The form is controlled: `name` and `email`
   state hold the raw text, and on every render two things are
   *derived* from them, never stored:
   - `nameError` / `emailError` — `validateName` / `validateEmail`
     run on the current values, so the inline errors appear and
     disappear as the user types;
   - `valid` — true only when both errors are empty. The submit
     button reads it directly (`disabled={!valid}`), so an invalid
     form cannot be submitted at all.
   Errors are shown only after a field has been typed in (`touched`),
   so a fresh form shows no errors — just a disabled button.
3. **Output.** On submit, the raw values are normalized once:
   the name is trimmed, the email is trimmed and lowercased, and the
   two are combined into one payload object:
   `{"name":"Ada Lovelace","email":"ada@example.com"}`. That payload
   is the only output. Editing either field afterwards clears it,
   because it was built from the old input.

## Expected result

| Input | Submit | Result |
| --- | --- | --- |
| blank form | blocked | button disabled, no payload |
| name `Ada`, email `not-an-email` | blocked | `Enter a valid email address.` inline |
| name `Ada`, email `ada@example.com` | enabled | no errors |
| name `  Ada Lovelace  `, email `ADA@Example.COM` | submitted | `{"name":"Ada Lovelace","email":"ada@example.com"}` |
| edit email after submit | — | payload cleared |
| name cleared | blocked | `Name is required.` inline |

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 11_Day_Events/applied-labs/r19-t037/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure. It drives the published
example itself — the form on the page is the thing under test.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
