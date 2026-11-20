# R19-T024: Day 18 note editor with a dirty-state indicator, state/invariant lab (added activity)

A small React note editor with a list of notes, a text area and a Save button. This is an added activity, not an original numbered exercise. All data is local, with no network calls.

## The invariant

A note shows the dirty marker if and only if its draft text differs from its last saved text.

The marker is derived from those two values and never stored separately. That gives the contract:

- Editing the selected note changes only its draft, so only its marker can appear.
- Saving copies the draft to the saved text for the selected note only. Its marker clears and other notes keep theirs.
- Selecting a note changes no marker, and each note keeps its own draft.
- Editing a note back to its saved text clears the marker.
- Saving a clean note changes nothing.
- An empty draft is a valid draft and counts as dirty when the saved text is not empty.

## Contribution focus: the invariant across a sequence

`check.mjs` replays one sequence of 13 operations (edit, select and save, including editing back to the saved text, saving a clean note and an empty draft). After every operation it checks the invariant three ways:

1. A hand-written table of the expected dirty notes, the selected note and the editor text.
2. A small reference model, written separately from the component, that computes the dirty notes from `draft !== saved`.
3. The real page: each note's marker, the editor text, the selected title and the status text.

The table and the model must agree with each other before the page is judged.

## Expected results

| Step | Operation | Dirty notes |
| --- | --- | --- |
| 1 | edit Groceries | Groceries |
| 2 | select Ideas | Groceries |
| 3 | edit Ideas | Groceries, Ideas |
| 4 | save Ideas | Groceries |
| 5 | select Groceries | Groceries (draft kept) |
| 6 | edit Groceries back to its saved text | none |
| 7 | edit Groceries, then save | none |
| 8 | save a clean note | none |
| 9 | edit To do to an empty draft | To do |
| 10 | save To do | none |

## Run it

From this folder, run `npm ci` and `npx playwright install chromium` once. Then run `npm run dev` and open the printed link.

## Automated check

From the repository root, run `node 18_Fetch_And_Axios/applied-labs/r19-t024/check.mjs`. It starts the app, launches Chromium, replays the