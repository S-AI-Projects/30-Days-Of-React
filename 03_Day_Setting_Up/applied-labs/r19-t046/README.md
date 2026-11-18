# Day 3 Applied Lab: Product Card with Safe Text & Worked Explanation (R19-T046)

## Overview
- **Task ID:** R19-T046
- **Student:** Nitish Singla
- **Assigned Branch:** `student/e26b07f0587` (implemented on `R19-T046`)
- **Lesson Topic:** Day 3 Setting Up – React app structure, JSX expressions, inline styling, importing media objects with accessible alternative text, and safe data injection.
- **Contract:** Render a product card with an image, label, and user-supplied description. The description `<script>alert(1)</script>` appears as text; the image has useful alternative text.
- **Contribution Focus:** Add a worked explanation from input through intermediate state to output, and make the published example executable by the test.

---

## 1. Lesson Context & Design Principles
In Day 3 of 30 Days of React, learners set up React applications and explore:
1. **Importing and Rendering Media Objects:** Embedding visual assets with meaningful semantic descriptions (`alt` attribute) rather than decorative placeholders.
2. **Injecting Data into JSX:** Inserting dynamic variables and expressions into JSX via curly braces (`{expression}`).
3. **Automatic Output Encoding (Security Boundary):** By default, React interpolates string values into DOM text nodes via `document.createTextNode()`, ensuring that untrusted user input containing HTML tags (such as `<script>alert(1)</script>`) is never parsed by the browser HTML parser or executed as script code.

All data in this lab is kept entirely local using self-contained vector graphics (SVG data URI) to prevent external network latency or flaky external CDN failures.

---

## 2. Worked Explanation: Input → Intermediate State → Output

The core contribution focus of this lab is a worked trace explaining the three lifecycle stages of user-supplied data:

```
┌────────────────────────────────┐
│         1. INPUT STAGE         │
│  - imageSrc: SVG vector URI    │
│  - imageAlt: "Ergonomic..."    │
│  - label: "Mechanical..."      │
│  - desc: "<script>alert(1)..." │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│    2. INTERMEDIATE STATE       │
│  - React state & props store   │
│  - JSX Virtual DOM creation    │
│  - Child type = "string"       │
│  - textContent mapping         │
│  - Bypasses innerHTML parser   │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│       3. OUTPUT STAGE          │
│  - Element: <p> tag in DOM     │
│  - Child: Node.TEXT_NODE       │
│  - Text: "<script>alert(1)..." │
│  - Script tags count: 0        │
│  - Alert calls count: 0        │
│  - Useful alt text: Present    │
└────────────────────────────────┘
```

### Detailed Lifecycle Stages

| Stage | Component / Entity | Representation | Security & Semantic Role |
| :--- | :--- | :--- | :--- |
| **Input** | `DEFAULT_PRODUCT` / Props | `{ label: "...", imageAlt: "...", description: "<script>alert(1)</script>" }` | Untrusted external or user input containing markup strings and semantic image metadata. |
| **Intermediate State** | React Virtual DOM / `traceDataFlow()` | `React.createElement('p', { className: 'product-description' }, description)` | React identifies `description` as a primitive string; prevents raw HTML parsing and prepares text node insertion. |
| **Rendered Output** | Browser DOM Tree | `<p data-testid="product-description">&lt;script&gt;alert(1)&lt;/script&gt;</p>` | The browser creates a `Node.TEXT_NODE`. The text `<script>alert(1)</script>` appears as visible literal text. Zero scripts execute. |

---

## 3. Playwright Verification Test Contract

The lab includes an automated check (`check.mjs`) implementing Playwright assertions:
1. Launches Vite dev server programmatically on a dedicated port.
2. Launches headless Chromium (with fallback to local Google Chrome if needed).
3. Verifies that the product card renders:
   - Image possesses non-empty, descriptive alt text (`"Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches"`).
   - Label displays the product title (`"Ergonomic Mechanical Keyboard Pro"`).
   - Description renders strictly as text (`"<script>alert(1)</script>"`).
   - `page.on('dialog')` asserts zero alert dialogs were invoked.
   - Zero `<script>` elements are present inside the product card.
4. Verifies the worked explanation components (`#worked-explanation`, `#explanation-input`, `#explanation-intermediate`, `#explanation-output`).
5. Exercises interactive mutation (changing input, testing alternate payloads, reset).
6. Captures and verifies zero console errors and zero page errors.
7. Saves comprehensive machine-readable and markdown evidence in `work/R19-T046/`.

---

## 4. How to Run

From the repository root directory:

```bash
# 1. Run the automated Playwright check
node 03_Day_Setting_Up/applied-labs/r19-t046/check.mjs

# 2. Or run interactive development mode
cd 03_Day_Setting_Up/applied-labs/r19-t046
npm run dev
```
