
# R19-T011: Cat gallery filtering (applied lab)

Added activity (not an original exercise). Renders a local cat list and filters it by origin, with no API calls.

- Inputs: filter text `Egypt`, then `Brazil`
- Expected: `Egypt` shows 2 cats; `Brazil` shows "No cats found for this origin."
- Run (from repo root): `node 19_projects/applied-labs/r19-t011/check.mjs`
- Exits non-zero if a check fails or the page logs errors.
- Setup: `cd 19_projects/applied-labs/r19-t011 && npm install && npx playwright install chromium`
