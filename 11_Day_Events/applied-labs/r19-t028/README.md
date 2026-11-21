# R19-T028: Day 11 form with inline validation, failure-and-recovery lab (added activity)

A small React form with labelled name and email fields and inline validation. This is an added activity, not an original numbered exercise. All data is local, with no live APIs.

## The contract

- Both fields have a visible label that is tied to the input.
- A blank name, or a blank or malformed email, blocks the submit and shows an inline error next to that field. No payload is produced.
- Valid data produces exactly one normalized payload: the name is trimmed with single spaces, and the email is trimmed and lower-cased.
- The form never reloads or navigates: the next valid input after a failure succeeds in the same session.
- A field with no error stays quiet while the user types. A field that is showing an error is re-checked as the user types, so the error clears as soon as the input is valid.

## Contribution focus: failure, then recovery without a restart

`check.mjs` plays one session of 13 actions. It shows the empty state, then a blocked submit, then a successful recovery, then a second failure and a second recovery. It plants a marker in the page before the first action and checks at the end that the marker survived and that the page navigated only once, so nothing restarted the example.

## Expected results

| Step | Action | Result |
| --- | --- | --- |
| 0 | initial state | no errors, "No payload yet", 0 submissions |
| 1 | submit the blank form | "Name is required", "Email is required", blocked |
| 2 | type a name | name error clears, email error stays |
| 3 | type a malformed email | "Enter a valid email address" |
| 4 | submit | still blocked, 0 submissions |
| 5 | type a valid email | no errors |
| 6 | submit | payload `{"name":"Ada Lovelace","email":"ada@example.com"}`, 1 submission |
| 7 | blank the name | no error yet, previous payload still shown |
| 8 | submit | "Name is required", payload cleared, 1 submission |
| 9-11 | type a valid name and email, submit | payload `{"name":"Grace Hopper","email":"grace@navy.mil"}`, 2 submissions |
| 12 | press Enter in the email field | exactly one more submission, 3 in total |

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed link.

## Automated check

From the repository root, run `node 11_Day_Events/applied-labs/r19-t028/check.mjs`. It starts the app, launches Chromium, plays the session above, rejects console and page errors, and exits non-zero if any assertion fails. Results and tool versions are saved to `work/R19-T028/results.json`.