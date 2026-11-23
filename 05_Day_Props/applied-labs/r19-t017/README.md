# R19-T017: Props contract, executable lesson example (applied lab)

Added activity (not an original numbered exercise). A `Rating` component accepts `value` and `max` props.

Contract: value=3, max=5 shows `3/5`; a missing value shows `Not rated`; invalid bounds are handled explicitly (an `Invalid rating: ...` message). A missing `max` defaults to 5.

## Worked explanation (input → intermediate state → output)

The props are first normalized into an explicit state (`status=rated`, `status=empty` or `status=invalid`), then the state is turned into text. Rules in order: max must be a whole number of at least 1; a missing value is empty; value must be a number; value must be between 0 and max.



```
value=3, max=5 → status=rated → 3/5
value missing, max=5 → status=empty → Not rated
value=0, max=5 → status=rated → 0/5
value=5, max=5 → status=rated → 5/5
value=6, max=5 → status=invalid → Invalid rating: value must be between 0 and max
value=-1, max=5 → status=invalid → Invalid rating: value must be between 0 and max
value=3, max=0 → status=invalid → Invalid rating: max must be a whole number of at least 1
value=3, max=2.5 → status=invalid → Invalid rating: max must be a whole number of at least 1
value=3, max missing (defaults to 5) → status=rated → 3/5
value="abc", max=5 → status=invalid → Invalid rating: value must be a number
```

## Run

- From repo root: `node 05_Day_Props/applied-labs/r19-t017/check.mjs`
- The check runs the example on a local page and also verifies that the lines above match what the page shows. It exits non-zero if a check fails or the page logs errors.
- Setup: `cd 05_Day_Props/applied-labs/r19-t017 && npm install && npx playwright install chromium`

