# R19-T019: Calculator integration, input-scale experiment (applied lab)

Added activity (not an original numbered exercise). A price calculator from quantity, unit price and discount (%).

- Contract: quantity=2, price=50, discount=10% displays `90`. Invalid input shows an error labelled with the field name (for example "Quantity: must be a whole number from 1 to 1000") and the total shows `n/a`.
- Contribution focus: three bounded interaction counts (1, 10 and 50 clicks of "+1 quantity"). The check asserts the total is correct each time and reports operation counts (renders and calculations). It records observed render and calculation counts without enforcing an exact count or speed threshold.
- Inputs: default 2 x 50 with 10% off; invalid quantity (abc, 0, 1.5), price -5, discount 150; then 1, 10 and 50 clicks.
- Expected: total 90 by default; totals 135, 540 and 2340 after 1, 10 and 50 clicks.
- Run (from repo root): `node 12_Day_Forms/applied-labs/r19-t019/check.mjs`
- Exits non-zero if a check fails or the page logs errors.
- Setup: `cd 12_Day_Forms/applied-labs/r19-t019 && npm install && npx playwright install chromium`
