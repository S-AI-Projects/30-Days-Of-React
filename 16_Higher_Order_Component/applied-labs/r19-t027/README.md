# R19-T027: Day 16 list and detail with explicit state ownership, executable lesson example (added activity)

A list/detail example built with class components and a small higher-order component. This is an added activity, not an original numbered exercise. All data is local, with no live APIs.

## The contract

- `App` (a class component) owns the only state, `selectedId`. The list and the detail panel are class components that own no state.
- Selecting record B updates only the detail panel: the list receives identical props, so it does not re-render.
- Clearing the selection shows the detail panel's empty state, "No record selected".
- Selecting the already-selected record, or clearing an empty selection, causes no extra detail render.

## Worked explanation: input, intermediate state, output

1. **Input:** the user clicks record B.
2. **Intermediate state:** `App.setState({ selectedId: 'B' })`, so `state` is `{"selectedId":"B"}`.
3. **Output:** `App` finds the record with that id and passes it to the detail panel as the `record` prop. The detail panel re-renders and shows "Record B". The list gets the same `records` and `onSelect` props as before, so it does not re-render, and its render count stays at 1.
4. **Input:** the user clicks "Clear selection". The state becomes `{"selectedId":null}`, `record` becomes `null`, and the detail panel shows "No record selected".

`withRenderCount` is the higher-order component that makes the render counts visible on the page.

## The published example (executed by the test)

`check.mjs` reads the JSON below and replays each step against the running page. After every step it checks the intermediate state, the detail output and both render counts. If this table and the code ever disagree, the check fails.

```json
{
  "steps": [
    { "action": "none", "label": "initial render", "state": { "selectedId": null }, "output": "No record selected", "renders": { "list": 1, "detail": 1 } },
    { "action": "select", "id": "B", "label": "select record B", "state": { "selectedId": "B" }, "output": "Record B", "renders": { "list": 1, "detail": 2 } },
    { "action": "select", "id": "C", "label": "select record C", "state": { "selectedId": "C" }, "output": "Record C", "renders": { "list": 1, "detail": 3 } },
    { "action": "select", "id": "C", "label": "select record C again", "state": { "selectedId": "C" }, "output": "Record C", "renders": { "list": 1, "detail": 3 } },
    { "action": "clear", "label": "clear the selection", "state": { "selectedId": null }, "output": "No record selected", "renders": { "list": 1, "detail": 4 } },
    { "action": "clear", "label": "clear again", "state": { "selectedId": null }, "output": "No record selected", "renders": { "list": 1, "detail": 4 } },
    { "action": "select", "id": "B", "label": "select record B after clearing", "state": { "selectedId": "B" }, "output": "Record B", "renders": { "list": 1, "detail": 5 } }
  ]
}
```

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed link.

## Automated check

From the repository root, run `node 16_Higher_Order_Component/applied-labs/r19-t027/check.mjs`. It starts the app, launches Chromium, executes the published example above, checks that the list content never changes, rejects console and page errors, and exits non-zero if any assertion fails. Results and tool versions are saved to `work/R19-T027/results.json`.