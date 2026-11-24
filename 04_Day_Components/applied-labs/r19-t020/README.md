# R19-T020: Component reuse, regression-focused lab (applied lab)

Added activity (not an original numbered exercise). One reusable `StatusBadge` renders pending, success and error with visible text. An unknown status shows an explicit fallback ("Unknown status").

- Contribution focus: a temporary one-line mutant of the decisive condition. The decisive line is `const known = Object.hasOwn(BADGES, status)`. The mutant is `const known = status in BADGES`, which wrongly treats inherited names such as `constructor` and `toString` as known statuses. `check.mjs` applies the mutant in memory (it is never saved to disk) and requires that the focused test passes on the correct example and fails on the mutant.
- Inputs: pending, success, error, banana, constructor, toString, and a missing status.
- Expected: Pending, Success, Error for the first three; "Unknown status" for banana, constructor, toString and the missing status.
- Run (from repo root): `node 04_Day_Components/applied-labs/r19-t020/check.mjs`
- Exits non-zero if the correct example fails, if the mutant is not caught, or if the page logs errors.
- Setup: `cd 04_Day_Components/applied-labs/r19-t020 && npm install && npx playwright install chromium`
