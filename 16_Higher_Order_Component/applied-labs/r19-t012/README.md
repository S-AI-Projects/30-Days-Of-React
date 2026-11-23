
# R19-T012: Class list/detail with boundary handling (applied lab)

Added activity (not an original numbered exercise). A class-based list/detail example. The parent owns the state; the list and detail are presentational.

- Boundary: valid record ids are whole numbers from 1 to 3. Anything else (empty, text, 0, 4, 1.5) is invalid and shows the empty state.
- Inputs: select Record B; jump to ids 1 and 3 (valid); 0, 4, abc, empty, 1.5 (invalid).
- Expected: selecting B updates only the detail panel; clearing or an invalid id shows "No record selected."
- Run (from repo root): `node 16_Higher_Order_Component/applied-labs/r19-t012/check.mjs`
- Exits non-zero if a check fails or the page logs errors.
- Setup: `cd 16_Higher_Order_Component/applied-labs/r19-t012 && npm install && npx playwright install chromium`
