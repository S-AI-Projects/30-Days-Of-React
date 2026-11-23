# R19-T014: Component composition, state/invariant lab (applied lab)

Added activity (not an original numbered exercise). A profile is composed from three small components (`ProfileName`, `ProfileRole`, `ProfileBio`) with explicit props. The biography is optional.

- Invariant: for any state, the profile shows the current name once, the role once, the biography only when it is non-blank, and never the text "undefined" or "null".
- Inputs (a short sequence): set biography, whitespace-only biography, clear biography, change name to Grace, change role to Mentor.
- Expected: "Ada" with "Role: Student" appears once and no biography at the start; the invariant holds after every operation.
- Run (from repo root): `node 01_Day_JavaScript_Refresher/applied-labs/r19-t014/check.mjs`
- Exits non-zero if a check fails or the page logs errors.
- Setup: `cd 01_Day_JavaScript_Refresher/applied-labs/r19-t014 && npm install && npx playwright install chromium`
