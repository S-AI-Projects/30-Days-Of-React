# R19-T039 evidence — Day 15 badges (third-party boundary, input-scale experiment)

## Inputs

`AppBadge` wraps the third-party display component (`ThirdPartyBadge`)
behind the explicit `adaptBadgeProps` adapter: app props
`{ label, level }` in, third-party props `{ text, tone }` out. Empty
or whitespace-only labels fall back to `No label`. The wrapper takes
its display component as an injected prop, so it can be tested with
the `StubBadge`, which renders the props it received as JSON.

## Expected vs actual

| Input | Expected | Actual |
| --- | --- | --- |
| label `Ada Lovelace`, level `success` | renders `Ada Lovelace`, tone `success` | same |
| label `` (empty), level `error` | renders `No label`, tone `error` | same |
| stub, label `Ada`, level `success` | `{"text":"Ada","tone":"success"}` | same |
| stub, label `   `, level `error` | `{"text":"No label","tone":"error"}` | same |

## Input-scale experiment (three bounded sizes, fixture.mjs)

| Size | Items rendered | Adapter calls | List reports |
| --- | --- | --- | --- |
| 1 | 1 | 1 | 1 |
| 10 | 10 | 10 | 10 |
| 100 | 100 | 100 | 100 |

First item at size 100 is `Item 1`, last is `Item 100`. These are
operation counts, not timings — no speed threshold is imposed. One
adapter call per item is the expected linear cost. The counts are
measured, not assumed: each list clears the adapter counter before
it renders, and a report sibling after the list reads the count once
its badges have rendered (verified stable across two consecutive
runs).

## Check command

From the repository root:

```
node 15_Third_Party_Packages/applied-labs/r19-t039/check.mjs
```

Result: **16/16 pass, exit 0, no console or page errors** (verified on
two consecutive runs).

## Negative test

Mutant: the adapter's empty-label fallback was removed, so an empty
label rendered as an empty string. The same check then exits 1 with
exactly 2 failures (the empty-label render and the stub-empty props).
The mutant was reverted after the test.

## Tool versions (verification run)

- Node v24.22.1, npm 10.9.4
- react 18.3.1, react-dom 18.3.1, vite 5.4.8, @vitejs/plugin-react 4.3.4,
  playwright 1.49.1 (pinned in the lab package/lockfile)
- Chromium 131.0.6778.33 (build 1148)

Note: re-run the check on the author's Mac and keep that output as the
final evidence.
