# R19-T041: Day 19 Cat Gallery Origin Filtering Lab (Added Activity)

## Learning Objective
Understand and practice client-side state filtering in React without external API dependencies. This lab demonstrates:
- How to filter a deterministic local dataset using React state (`useState`) and memoization (`useMemo`).
- How to handle empty states gracefully when a search or filter yields no results.
- How to build a reference comparison test that checks actual UI output against an independent expected-result table and reference filter function.

> **Note:** This is an **added activity**, not an original numbered exercise from the lesson.

---

## Local Fixture Data
The application operates entirely on local fixture data (`fixture.mjs`). No external HTTP requests or third-party APIs are contacted.

```javascript
export const CATS = [
  {
    id: 1,
    name: 'Nile',
    origin: 'Egypt',
    temperament: 'Alert, Agile, Intelligent',
    description: 'A graceful spotted cat native to Egypt.',
  },
  {
    id: 2,
    name: 'Sakura',
    origin: 'Japan',
    temperament: 'Playful, Loving, Intelligent',
    description: 'An iconic Japanese Bobtail with expressive features.',
  },
  {
    id: 3,
    name: 'Cairo',
    origin: 'Egypt',
    temperament: 'Curious, Loyal, Lively',
    description: 'An affectionate Egyptian cat known for high agility.',
  },
];
```

---

## Independent Expected-Result Table
Before testing the real page, `check.mjs` computes expected outcomes from an independent reference model (`referenceFilter`) and cross-validates with this hand-written table:

| Step | Scenario | Filter Input | Expected Visible Cats | Expected Count | Empty State Message |
|------|----------|--------------|-----------------------|----------------|---------------------|
| 1 | Initial state | `""` (empty) | Nile, Sakura, Cairo | 3 | Hidden |
| 2 | Filter Egypt | `"Egypt"` | Nile, Cairo | 2 | Hidden |
| 3 | Filter Japan | `"Japan"` | Sakura | 1 | Hidden |
| 4 | Filter Brazil | `"Brazil"` | None | 0 | `No cats found for origin "Brazil".` |
| 5 | Clear filter | `""` (cleared) | Nile, Sakura, Cairo | 3 | Hidden |

---

## Setup Instructions

From the lab directory (`19_projects/applied-labs/r19-t041`):

```bash
# 1. Install dependencies
npm ci

# 2. Ensure Playwright browser is available (or use system Google Chrome)
npx playwright install chromium

# 3. Start development server
npm run dev
```

Open `http://localhost:5173` in your browser to interact with the cat gallery.

---

## Testing Instructions

From the **repository root directory**:

```bash
node 19_projects/applied-labs/r19-t041/check.mjs
```

The automated check will:
1. Cross-check the independent expected table against `referenceFilter`.
2. Start an isolated Vite dev server.
3. Launch Playwright Chromium (or system Google Chrome fallback).
4. Run all filtering scenarios against the live browser session.
5. Verify button controls (`Egypt`, `Japan`, `Brazil`, `Clear Filter`).
6. Enforce that zero browser console errors, page errors, or network requests failed.
7. Save verification evidence to `work/R19-T041/`.
8. Exit with code `0` on complete success, or non-zero on any failure.

---

## Expected-versus-Actual Comparison

| Step | Operation / Action | Expected Result | Actual Result | Status |
|------|--------------------|-----------------|---------------|--------|
| 1 | Initial load (no filter) | 3 cats (`Nile`, `Sakura`, `Cairo`) | 3 cats (`Nile`, `Sakura`, `Cairo`) | **PASS** |
| 2 | Filter input: `"Egypt"` | 2 cats (`Nile`, `Cairo`) | 2 cats (`Nile`, `Cairo`) | **PASS** |
| 3 | Filter input: `"Japan"` | 1 cat (`Sakura`) | 1 cat (`Sakura`) | **PASS** |
| 4 | Filter input: `"Brazil"` | 0 cats, empty state displayed | 0 cats, empty state displayed | **PASS** |
| 5 | Clear filter button | 3 cats (`Nile`, `Sakura`, `Cairo`) | 3 cats (`Nile`, `Sakura`, `Cairo`) | **PASS** |
| 6 | Error check | 0 console / page errors | 0 console / page errors | **PASS** |

