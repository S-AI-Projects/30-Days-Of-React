# R19-T009 — Day 4: Component Reuse — Input-Scale Experiment

## Overview

This applied lab demonstrates reusable React component design using a parameterized `StatusBadge` component. It implements deterministic rendering across pending, success, error, and an explicit fallback for unknown/custom states, and measures bounded input scalability across 5, 20, and 50 rendered items without arbitrary speed or timing thresholds.

## Component Contract

| Status | Rendered Text / Behavior | Fallback Handling |
|---|---|---|
| `pending` | Label or default "Pending" | Active |
| `success` | Label or default "Success" | Active |
| `error` | Label or default "Error" | Active |
| Unknown / Unrecognized | Label or default "Unknown Status" | Explicit default fallback applied |

## Contribution Focus: Input-Scale Experiment

- Tested across three bounded input scales: **5**, **20**, and **50** badges.
- Asserts correctness for badge text, attributes, and total rendered count at each scale.
- Reports exact operational counts (`operation-count`, `badge-count`) rather than enforcing fragile execution time thresholds.

## Usage

```bash
node 04_Day_Components/applied-labs/r19-t009/check.mjs
```

Runs the automated verification suite using Playwright and an ephemeral local HTTP server.
