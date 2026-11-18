# Day 3 Applied Lab: Product Card with Safe Text & Extracted Responsibility (R19-T044)

> **Task ID:** R19-T044 · 4 of 10  
> **Topic:** Day 3: Setting Up (JSX syntax, styles in JSX, dynamic data injection, media objects with useful alternative text)  
> **Status:** Added Activity (not an original numbered exercise)

---

## 1. Goal & Contract Specification

Render a product card component featuring:
1. **Product Image:** An `<img>` tag with a valid source and a **useful, descriptive alternative text** (`alt` attribute).
2. **Product Label:** A category or badge label rendered cleanly.
3. **User-Supplied Description:** A description field populated with untrusted user input `"<script>alert(1)</script>"`.
   - **Critical Invariant:** The string `"<script>alert(1)</script>"` MUST render strictly as plain text (a DOM `Text` node).
   - It MUST NOT execute JavaScript, insert executable `<script>` DOM elements, or trigger `window.alert()`.
   - In DOM inspection, `textContent` equals literal `"<script>alert(1)</script>"` and `innerHTML` contains escaped entities `&lt;script&gt;alert(1)&lt;/script&gt;`.

All fixture data is local and frozen (`INITIAL_PRODUCT`).

---

## 2. Contribution Focus

> **Assigned Focus:** Start from a working version, capture its behavior, and extract one clearly named responsibility without changing the contract.

### Phase 1: Working Baseline Version (`ProductCardBaseline`)
The lab begins with a working monolithic component where image rendering, label presentation, user-supplied text escaping, and container styles are coupled in a single component.

### Phase 2: Behavior Capture
Before refactoring, the external contract is captured through strict behavioral specifications:
- **Contract Signature:** Accepts `{ product }` or destructured `{ image, label, description, title, price }`.
- **Image Assertion:** Image element `data-testid="product-image"` has non-empty, descriptive alt text (`> 10` chars, not generic "image").
- **Label Assertion:** Label element `data-testid="product-label"` renders the expected string.
- **Text Safety Assertion:** Description element `data-testid="product-description"` renders literal `"<script>alert(1)</script>"` as a text node; browser dialogs remain zero.
- **DOM Stability:** Container card has `data-testid="product-card"`.

### Phase 3: Extract One Clearly Named Responsibility (`ProductDescription`)
A single, clearly named responsibility is extracted:
- **Component:** `ProductDescription`
- **Extracted Responsibility:** *Encapsulating user-supplied description presentation and safe plain-text rendering*.
- **Why Extract This?** Isolating user-supplied input rendering ensures:
  1. The untrusted text boundary is centralized in a dedicated single-responsibility component.
  2. Formatting, styling, and text-node guarantees can be unit-tested in isolation without mounting the entire card infrastructure.
  3. No changes to the public `ProductCard` contract or rendered DOM contract.

### Phase 4: Composed Refactored Component (`ProductCard`)
`ProductCard` delegates description rendering to `ProductDescription`. The external contract, props interface, DOM test IDs, and rendered outputs are 100% equivalent to the baseline working version.

---

## 3. File Structure

```
03_Day_Setting_Up/applied-labs/r19-t044/
├── README.md           # This lab guide
├── package.json        # Dependencies (React 18, Vite, Playwright)
├── package-lock.json   # Deterministic dependency lock
├── vite.config.js      # Local Vite configuration
├── index.html          # HTML entry point
├── main.jsx            # React 18 createRoot mount
├── example.jsx         # Implementation (Baseline, Extracted Responsibility, Refactored Card, Interactive App)
├── check.mjs           # Automated Playwright test suite verifying contract and invariants
└── .gitignore          # Ignores node_modules and build artifacts
```

---

## 4. Verification & Testing

### Running the automated test suite
From the repository root:
```bash
node 03_Day_Setting_Up/applied-labs/r19-t044/check.mjs
```

The test runner will:
1. Boot a fresh local Vite development server instance.
2. Launch a headless Playwright Chromium browser.
3. Attach error monitors rejecting any `console.error`, `pageerror`, or dialog events (`dialog.on('alert')`).
4. Execute verification steps against the product card contract, image alt text, text-node safety, and extracted responsibility equivalence.
5. Record execution results in `work/R19-T044/results.json` and `work/R19-T044/evidence.md`.
6. Terminate cleanly with exit code `0` on success, or non-zero on assertion failure.
