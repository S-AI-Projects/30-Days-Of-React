# R19-T056: Day 6 Stable List Keys (Added Activity)

A focused React applied lab demonstrating stable keys and component refactoring in list rendering. This is an added activity, not an original numbered exercise. All data is local with no live APIs.

## The Contract
- Renders and reorders a list of editable records using stable IDs as keys.
- After reordering, each edited value strictly stays with its record.
- No `key` prop warnings or React console warnings are emitted.

## Contribution Focus: Refactoring with Encapsulated Responsibility
- Extracts `EditableRecordRow` as a dedicated, clearly named component handling individual record presentation, user editing, and relative movement.
- Keeps the parent list controller clean while preserving the exact contract and state continuity.

## Automated Check
From the repository root:
```bash
node 06_Day_Map_List_Keys/applied-labs/r19-t056/check.mjs
```
The check runs Playwright assertions to verify list rendering, user text editing, list reordering, state persistence across reordering, and zero key warnings. Results are saved to `work/R19-T056/results.json`.
