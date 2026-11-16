# Badges — Day 15 applied lab (R19-T039)

A small third-party display component (`ThirdPartyBadge`) wrapped
behind an application component (`AppBadge`) with an explicit prop
adapter (`adaptBadgeProps`). Known input renders correctly; an empty
value has a fallback; the wrapper is tested with a component stub
(`StubBadge`).

## The boundary

App props come in as `{ label, level }`. The adapter turns them into
third-party props `{ text, tone }`:

- `text`: the label trimmed, or `No label` when the label is empty or
  only spaces.
- `tone`: `error` for level `error`, `success` for level `success`,
  `info` for anything else.

The wrapper never touches the vendor component's props directly, and
the vendor component never sees app props. The display component is
injected (`DisplayComponent`, defaulting to the third-party one), so
the wrapper can be tested against the stub, which renders the props
it received as JSON.

## Expected result

| Input | Rendered | Tone |
| --- | --- | --- |
| label `Ada Lovelace`, level `success` | Ada Lovelace | success |
| label `` (empty), level `error` | No label | error |
| stub, label `Ada`, level `success` | `{"text":"Ada","tone":"success"}` | — |
| stub, label `   `, level `error` | `{"text":"No label","tone":"error"}` | — |

## Input-scale experiment

The wrapper renders three bounded list sizes — 1, 10 and 100 items
(`fixture.mjs`). The check asserts correctness at each size and
reports the adapter-call counts:

| Size | Items rendered | Adapter calls |
| --- | --- | --- |
| 1 | 1 | 1 |
| 10 | 10 | 10 |
| 100 | 100 | 100 |

These are operation counts, not timings — no speed threshold is
imposed. One adapter call per item is the expected linear cost.

## Run

From the repository root:

```
npm ci
npx playwright install chromium
node 15_Third_Party_Packages/applied-labs/r19-t039/check.mjs
```

The check builds the lab, serves it on http://localhost:4173, drives it
in Chromium and exits non-zero on any failure.

## If the browser download stalls

The Playwright browser download can stall on some connections. If it
does, the check falls back to the Google Chrome already installed on
the Mac, at `/Applications/Google Chrome.app`.
