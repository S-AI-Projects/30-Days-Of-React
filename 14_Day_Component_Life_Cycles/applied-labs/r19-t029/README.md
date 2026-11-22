# R19-T029: Day 14 injected fetch adapter, input-scale experiment (added activity)

A class component with life-cycle methods that loads data through an injected adapter, with loading, error and retry states. This is an added activity, not an original numbered exercise. All data is local fixtures, with no live API call.

## The contract

- `Loader` loads once in `componentDidMount` and ignores a late response in `componentWillUnmount`.
- The adapter is injected, so the page never uses the network. The fixtures cover a 200 response, a rejected request, and a retry that succeeds.
- A rejected request shows `Error: Network down` and a Retry button. Retry shows `Loading`, then the loaded list.

## Contribution focus: three bounded input sizes, counts instead of speed

`check.mjs` runs the same fixture at three input sizes (1, 10 and 100 items). It asserts correctness (row count, first and last item) and reports operation counts and render counts. It sets no speed threshold, because timings vary between machines.

| Fixture | Rows | Adapter calls | Loader renders |
| --- | --- | --- | --- |
| 200 response, 1 item | 1 | 1 | 2 |
| 200 response, 10 items | 10 | 1 | 2 |
| 200 response, 100 items | 100 | 1 | 2 |
| rejected, then retry succeeds | 3 | 2 | 4 |

The rows grow with the input, while the adapter calls and Loader renders stay constant. The check asserts exactly that, and it also asserts that repeating a size gives identical counts.

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed link.

## Automated check

From the repository root, run `node 14_Day_Component_Life_Cycles/applied-labs/r19-t029/check.mjs`. It starts the app, launches Chromium, runs the fixtures above, rejects console and page errors, checks that no request leaves localhost, and exits non-zero if any assertion fails. The measured counts and tool versions are saved to `work/R19-T029/results.json`.