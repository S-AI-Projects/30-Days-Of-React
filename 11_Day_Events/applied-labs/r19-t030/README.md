# R19-T030: Day 11 form regression lab, a one-line mutant and a focused test (added activity)

A small React form with labelled name and email fields and inline validation. This is an added activity, not an original numbered exercise. All data is local, with no live APIs.

## The contract

- Both fields have a visible label that is tied to the input.
- A blank name, or a blank or malformed email, blocks the submit and shows an inline error. No payload is produced.
- Valid data produces exactly one normalized payload: the name is trimmed with single spaces, and the email is trimmed and lower-cased.

## Contribution focus: a one-line mutant and a focused test

The decisive condition is the line in `validate` that treats a name made only of spaces as blank:

    if (name.trim() === '') errors.name = 'Name is required';

`check.mjs` serves a second copy of the app in which that one line is mutated in memory:

    if (name === '') errors.name = 'Name is required';

The mutant is temporary: it exists only in the check's second server, and the check asserts that `example.jsx` on disk is unchanged.

The focused test submits a name of three spaces with a valid email. On the correct example it must show "Name is required", produce no payload, and leave the submission count at 0.

| Run | General contract session | Focused test |
| --- | --- | --- |
| Correct example | passes | passes |
| Mutant | passes (the mutant survives) | fails (the mutant is killed) |

The general session alone does not notice the mutant, which is why the focused test is there.

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed link.

## Automated check

From the repository root, run `node 11_Day_Events/applied-labs/r19-t030/check.mjs`. It plays the general session and the focused test on the correct example, applies the mutant in memory, shows that the general session survives and the focused test fails on it, checks that the file on disk is unchanged, rejects console and page errors, and exits non-zero if any assertion fails. Results and tool versions are saved to `work/R19-T030/results.json`.