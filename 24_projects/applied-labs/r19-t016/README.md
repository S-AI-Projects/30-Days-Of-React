# R19-T016: Hook composition, refactor an applied example (applied lab)

Added activity (not an original numbered exercise). A form (name + email) with derived validation. Validity is computed from the field values on every render and never stored, so it cannot go stale after reset.

- Contribution focus: start from a working version (`useFormOriginal`), capture its behaviour in `check.mjs`, then extract one clearly named responsibility (`useValidity`) into a composed hook (`useFormRefactored`) without changing the contract. The check runs the same steps against both versions (`?version=original` and `?version=refactored`) and requires identical results.
- Inputs: name = Ada; email = ada (invalid), ada@x.com (valid); name = spaces only (invalid); Reset; email = a@b.
- Expected: changing a field updates its validity; after Reset all fields are empty and invalid.
- Run (from repo root): `node 24_projects/applied-labs/r19-t016/check.mjs`
- Exits non-zero if a check fails or the page logs errors.
- Setup: `cd 24_projects/applied-labs/r19-t016 && npm install && npx playwright install chromium`
