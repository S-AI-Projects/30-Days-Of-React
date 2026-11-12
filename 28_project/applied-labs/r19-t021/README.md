# R19-T021: Day 28 deployment base paths (added activity)

A small React example showing local navigation and asset paths working under a non-root base path (`/course/`). This is an added activity, not an original numbered exercise.

## What it shows

- `vite.config.js` sets `base: '/course/'`.
- `example.jsx` builds the logo URL and the nav links from `import.meta.env.BASE_URL`.
- A page refresh on `/course/about` keeps the About route.
- All data is local, with no live APIs.

## Inputs and expected result

- Open `/course/`: the heading is "Home" and the logo loads from `/course/logo.svg`.
- Click "About": the URL is `/course/about` and the heading is "About".
- Refresh on `/course/about`: still `/course/about`, heading "About".
- Open `/course/countries`: the list shows Finland, India, Japan.
- Open `/course/missing`: the heading is "Not found".
- Across all of the above: no console errors, page errors or failed requests.

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed `/course/` link.

## Automated check

From the repository root, run `node 28_project/applied-labs/r19-t021/check.mjs`. It starts the app, launches Chromium, tests the behaviour above and exits non-zero if any assertion fails. Results and tool versions are saved to `work/R19-T021/results.json`.