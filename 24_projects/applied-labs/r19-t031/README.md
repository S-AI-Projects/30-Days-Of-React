# R19-T031 — Hook composition: form state and derived validation

Day 24 applied lab. A small profile form (name + email) built by composing
two `useField` hooks into one `useValidatedForm` hook.

## The contract

- Editing a field updates its validity immediately.
- Validity, field errors and the summary are **derived** from the field
  values with `useMemo` — they are computed, never stored — so they cannot
  go stale.
- Reset restores the field values; everything derived follows. After a
  reset the form is invalid again, the summary is empty and no success
  message remains.
- A blank submit shows both field errors and no success message.

## Design

- `useField(initialValue)` owns one field's value and touched state.
- `useValidatedForm()` composes the name and email fields and derives
  `nameError`, `emailError`, `isValid` and `summary` from their values.
  Nothing derived is ever written to state, so there is only one source
  of truth: the field values.
- The form uses `noValidate` so the browser's native validation never
  hides the React validation.

## Run it

From this folder:

```bash
npm ci
npx playwright install chromium
npm run dev
```

## Check it

From the repository root:

```bash
node 24_projects/applied-labs/r19-t031/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and stops the server. It exits non-zero if any assertion
fails or any console/page error appears.

## If the browser download stalls

`npx playwright install chromium` fetches Chromium from Playwright's CDN.
If that download keeps timing out, the check falls back to the Google
Chrome already installed on the Mac
(`/Applications/Google Chrome.app`), so `node .../check.mjs` still runs.

## Versions (pinned)

- Node >= 18
- react 18.3.1, react-dom 18.3.1
- vite 5.4.8, @vitejs/plugin-react 4.3.4
- playwright 1.49.1

Why Vite and not the day-24 boilerplate: the boilerplate is Create React
App 3.4.3 (React 16, webpack 4), which does not run on current Node
without the legacy OpenSSL workaround. The lab pins its own versions in
`package.json` / `package-lock.json`, as the issue allows.
