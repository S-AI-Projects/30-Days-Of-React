# Evidence: R19-T044 Product Card with Safe Text & Extracted Responsibility Lab

## Overview
- **Task ID:** R19-T044 · 4 of 10
- **URN:** e26b07f0587
- **Branch:** `R19-T044` (and `student/e26b07f0587/R19-T044`)
- **Goal:** Render a product card with an image, label, and user-supplied description. The description `<script>alert(1)</script>` appears as text; the image has useful alternative text.
- **Contribution Focus:** Start from a working version, capture its behavior, and extract one clearly named responsibility without changing the contract.

## Input Fixture
The lab renders the following frozen local fixture:
```json
{
  "id": "prod-react-mechanical-keyboard",
  "title": "Mechanical Ergonomic Keyboard",
  "label": "Hardware & Peripherals",
  "image": {
    "src": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' ...>",
    "alt": "Ergonomic split mechanical keyboard featuring custom PBT keycaps and vibrant RGB backlighting"
  },
  "description": "<script>alert(1)</script>",
  "price": "$149.00"
}
```

## Stated Contract & Invariants
1. **Useful Alternative Text Invariant:**
   $$\text{alt}(I) \neq \emptyset \quad \land \quad |\text{alt}(I)| \ge 20 \quad \land \quad \text{alt}(I) \not\equiv \text{"image"}$$
   The image carries meaningful alternative text describing the product for accessibility and screen readers.
2. **Safe Text Interpolation Invariant (XSS Protection):**
   $$\text{nodeType}(\text{description}) \equiv \text{Node.TEXT\_NODE} \quad \land \quad \text{textContent} \equiv \text{"<script>alert(1)</script>"}$$
   $$\text{innerHTML} \equiv \text{"&lt;script&gt;alert(1)&lt;/script&gt;"} \quad \land \quad \text{AlertCount} = 0$$
   User-supplied strings containing script tags are safely escaped as plain text; zero script elements are parsed or executed.
3. **Responsibility Extraction Invariant:**
   $$\text{DOM}(\text{ProductCardBaseline}) \equiv \text{DOM}(\text{ProductCard}_{\text{refactored}})$$
   The extracted component `ProductDescription` encapsulates user-supplied text representation while maintaining 100% contract equivalence with the initial working baseline.

## Expected vs Actual Results Table Across Operations

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|------|----------|--------|-----------------|---------------|--------|
| 1 | Page Title & Mount Verification | `Mount` | Includes "Product Card with Safe Text & Extracted Responsibility" | Day 3 Applied Lab: Product Card with Safe Text & Extracted Responsibility (R19-T044) | **PASS** |
| 2 | Product Image & Useful Alt Text Invariant | `Inspect <img> alt` | Non-empty, descriptive alt text describing the product (> 20 chars) | alt="Ergonomic split mechanical keyboard featuring custom PBT keycaps and vibrant RGB backlighting" (93 chars) | **PASS** |
| 3 | Product Label Contract | `Inspect label element` | Hardware & Peripherals | Hardware & Peripherals | **PASS** |
| 4 | Safe Text Injection Contract (<script> as text) | `Inspect description textContent and innerHTML` | textContent === "<script>alert(1)</script>", innerHTML escaped, 0 dialogs | textContent="<script>alert(1)</script>", innerHTML="&lt;script&gt;alert(1)&lt;/script&gt;", dialogCount=0 | **PASS** |
| 5 | Extracted Responsibility Verification (ProductDescription) | `Inspect component delegation and responsibility tag` | data-responsibility="user-supplied-text-presentation", data-responsibility-extracted="ProductDescription" | responsibility="user-supplied-text-presentation", cardDeclared="ProductDescription" | **PASS** |
| 6 | Baseline vs Refactored Contract Invariance | `Compare baseline vs refactored side-by-side` | Exact identical image, label, and description contracts between baseline and refactored | alt="Ergonomic split mechanical keyboard featuring custom PBT keycaps and vibrant RGB backlighting", label="Hardware & Peripherals", desc="<script>alert(1)</script>" (100% matched) | **PASS** |
| 7 | Dynamic XSS Injection Payload (<img onerror>) as Text | `Apply "<img src=\"x\" onerror=\"alert(1)\"/>"` | Rendered as safe text node; 0 alerts triggered | textContent="<img src="x" onerror="alert(1)"/>", dialogCount=0 | **PASS** |
| 8 | Normal Description Update | `Apply normal description text` | High-durability tactile switches with custom sound dampening. | High-durability tactile switches with custom sound dampening. | **PASS** |
| 9 | Reset Invariant & Contract Restoration | `Click Reset` | Restores initial <script>alert(1)</script> and refactored view | desc="<script>alert(1)</script>", view="refactored" | **PASS** |
| 10 | Absence of Console, Page, and Dialog Errors | `Verify error logs` | 0 console errors, 0 page errors, 0 dialog alerts, 0 request failures | consoleErrors=0, pageErrors=0, dialogs=0, requestFailures=0 | **PASS** |

## Console, Page & Dialog Errors
- Console errors: `0`
- Page errors: `0`
- Browser dialog alerts: `0`
- Failed requests: `0`

## Test Execution Details
- **Exact Test Command:** `node 03_Day_Setting_Up/applied-labs/r19-t044/check.mjs`
- **Exit Code:** `0`
- **Overall Result:** **PASSED**

## Negative / Mutant Testing
A mutant test was executed by temporarily replacing the safe JSX text interpolation with `dangerouslySetInnerHTML={{ __html: description }}` or omitting the `alt` text on the image.
- **Result:** The automated check immediately failed at Check 2/Check 4 with non-zero exit code (`1`), shutting down the browser and server cleanly.
- Reverting the mutation restored full pass status (`exit 0`).

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Chromium:** `131.0.6778.33`
