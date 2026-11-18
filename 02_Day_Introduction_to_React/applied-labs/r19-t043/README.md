# Day 2 Applied Lab: Derive Filtered Total from Props Without Mutation (R19-T043)

## Goal
Derive a filtered total from props without mutating the supplied records. Given supplied records with paid amounts 10 and 5 plus unpaid 20, the derived paid total displays **15**, while the input array and its records remain completely unchanged.

## Contribution Focus: Invariant Across Operations
The core focus of this lab is to state and test the mathematical invariant connecting input records and filter state to the rendered output across a deterministic sequence of operations:

### The Stated Invariant
$$\text{Output Total}(R, S) = \sum_{r \in R, \text{match}(r, S)} r.\text{amount}$$
$$\text{subject to } R_{t} \equiv R_{0} \quad (\text{zero in-place mutations on input array or objects})$$

Where:
- $R$ is the collection of supplied records: `[{ id: 1, amount: 10, paid: true }, { id: 2, amount: 5, paid: true }, { id: 3, amount: 20, paid: false }]`
- $S$ is the active filter predicate (`'paid'`, `'unpaid'`, or `'all'`).
- The derived output is computed on-the-fly using pure functional transforms (`.filter()` and `.reduce()`).
- No mutation methods (`.splice()`, `.sort()`, `.pop()`, or direct property reassignment) are ever invoked on the input prop data.

### Sequence of Operations & Invariant Evaluation
1. **Initial State (Filter: Paid):**
   - Inputs: `[10 (paid), 5 (paid), 20 (unpaid)]`
   - Invariant: $10 + 5 = 15$
   - Displayed total: `15` | Input array length: `3` | Mutations: `0`
2. **Switch Filter to "Unpaid":**
   - Invariant: $20 = 20$
   - Displayed total: `20` | Input array length: `3` | Mutations: `0`
3. **Switch Filter to "All":**
   - Invariant: $10 + 5 + 20 = 35$
   - Displayed total: `35` | Input array length: `3` | Mutations: `0`
4. **Switch Filter to "Paid":**
   - Invariant: $10 + 5 = 15$
   - Displayed total: `15` | Input array length: `3` | Mutations: `0`
5. **Add New Record Immutably ($30, Paid):**
   - Appended via array spread `[...prev, newRecord]`
   - Invariant: $10 + 5 + 30 = 45$
   - Displayed total: `45` | New records count: `4` | Original initial prop untouched.
6. **Toggle Record 3 Immutably (Unpaid -> Paid):**
   - Updated via immutable `.map()`
   - Invariant: $10 + 5 + 30 + 20 = 65$
   - Displayed total: `65` | Initial prop untouched.
7. **Reset to Initial State:**
   - Invariant: $10 + 5 = 15$
   - Displayed total: `15` | Input array length: `3` | Mutations: `0`

## Day 2 Alignment: Pure JSX Data Injection
Day 2 introduces React, JSX syntax, and injecting JavaScript dynamic data (numbers, arrays, and objects) directly into JSX elements using `{}` expressions. This lab demonstrates that UI computation belongs in pure declarative JSX derivations rather than imperative data mutation.

## Running the Application Locally
```bash
cd 02_Day_Introduction_to_React/applied-labs/r19-t043
npm install
npm run dev
```

## Running Verification Checks
From repository root:
```bash
node 02_Day_Introduction_to_React/applied-labs/r19-t043/check.mjs
```
The Playwright test runner verifies:
- Initial derivation displays 15 for paid amounts 10 and 5 plus unpaid 20.
- Immutability of the input array (exact lengths, elements, and values intact).
- Invariant satisfaction across all 7 steps of the operation sequence.
- Zero console errors, page errors, or network failures.
- Saves evidence to `work/R19-T043/`.
