# R19-T005 — Day 27: Ref Focus Management — Deterministic Fixture Lab

## Overview

This applied lab demonstrates **deterministic ref-based focus management** using React `useRef` and `useLayoutEffect`. The core behavioural contract is verified twice in a single automated run to prove that two isolated Playwright executions always produce identical results.

## Behavioural Contract

| Event | Expected behaviour |
|---|---|
| Dialog **opens** | Focus moves to the labelled `<input>` inside the dialog |
| Dialog **closes** | Focus is restored to the **trigger button** |
| Typing in input | **No ref-driven re-renders** (ref not stored in state) |
| Two isolated test passes | Produce **byte-for-byte identical** assertion outcomes |

## Implementation Details

- `useRef` is used to hold references to the trigger button and the dialog input.
- `useLayoutEffect` fires synchronously after the DOM is painted; focus is applied there so the browser's accessibility tree is updated before the next frame.
- `requestAnimationFrame` is used to restore trigger focus after the state update closes the dialog, ensuring the DOM has settled.
- The ref objects are **never stored in React state**, so normal typing into the input does not trigger component re-renders through the ref mechanism.
- A `renderCounterRef` (plain `useRef`) tracks renders without causing new renders itself.

## Deterministic Fixture Design

All behaviour is driven by explicit user events (click open, type, click close). There are:
- **No timers** (no `setTimeout`, `setInterval`, or `Date.now()` dependencies)
- **No random values**
- **No network calls**

As a result, any two isolated Playwright executions of `check.mjs` will exercise identical DOM states and produce identical pass/fail verdicts.

## Usage

```bash
# From the repository root
node 27_Ref/applied-labs/r19-t005/check.mjs
```

The script spins up an ephemeral local HTTP server, launches headless Chromium, runs the full assertion suite **twice** (two isolated page navigations), compares the results, and exits with code **0** on success or **1** on failure.

## File Structure

```
27_Ref/applied-labs/r19-t005/
├── example.jsx   — React component (FocusDialogLab)
├── check.mjs     — Playwright automated verification (runs suite twice)
├── package.json  — Pinned React + Playwright
└── README.md     — This file
```

## Invariants

1. `document.activeElement` === `#dialog-input` immediately after open.
2. `document.activeElement` === `#open-btn` immediately after close.
3. `#render-count-value` increments by exactly 2 for open+close combined (one state update each), not on every keystroke.
4. Zero browser console errors throughout the entire interaction sequence.
5. Zero unhandled page errors.
