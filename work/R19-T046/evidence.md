# Evidence: R19-T046 Product Card with Safe Text & Worked Explanation

## Overview
- **Task ID:** R19-T046
- **URN:** e26b07f0587
- **Branch:** `R19-T046` (and `student/e26b07f0587/R19-T046`)
- **Goal:** Render a product card with an image, label and user-supplied description. The description `<script>alert(1)</script>` appears as text; the image has useful alternative text.
- **Contribution Focus:** Add a worked explanation from input through intermediate state to output, and make the published example executable by the test.

## Input Contract
```json
{
  "label": "Ergonomic Mechanical Keyboard Pro",
  "imageAlt": "Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches",
  "description": "<script>alert(1)</script>"
}
```

## Worked Explanation: Lifecycle Trace
1. **Input Stage:** Component receives raw strings via props/state: label, descriptive `alt` text, and untrusted description `<script>alert(1)</script>`.
2. **Intermediate State:** React JSX evaluates `<p>{description}</p>` as a Virtual DOM element where `children` is of primitive type `string`. React routes this through safe text node creation (`document.createTextNode`), bypassing the browser HTML parser.
3. **Rendered Output:** The DOM receives a text node containing literal characters `<script>alert(1)</script>`. Zero `<script>` elements are inserted into the document, zero alert dialogs fire, and the image renders with accessible alt text.

## Expected vs Actual Results Table

| Step | Scenario | Action | Expected Output | Actual Output | Status |
|:---:|---|---|---|---|:---:|
| 1 | Published example executable test: traceDataFlow model returns valid trace | `server.ssrLoadModule("./example.jsx") & traceDataFlow()` | `{"childType":"string","scriptElements":0,"text":"<script>alert(1)</script>"}` | `{"childType":"string","scriptElements":0,"text":"<script>alert(1)</script>"}` | **PASS** |
| 2 | Product card mounts with correct product label | `Mount & check [data-testid="product-label"]` | `Ergonomic Mechanical Keyboard Pro` | `Ergonomic Mechanical Keyboard Pro` | **PASS** |
| 3 | Product card image contains useful alternative text | `Inspect [data-testid="product-image"] alt attribute` | `Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches` | `Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches` | **PASS** |
| 4 | Description <script>alert(1)</script> appears strictly as text with zero script execution | `Inspect textContent, innerHTML, script elements, and dialog events` | `{"text":"<script>alert(1)</script>","scriptTags":0,"dialogs":0,"childNodeType":3}` | `{"text":"<script>alert(1)</script>","scriptTags":0,"dialogs":0,"childNodeType":3}` | **PASS** |
| 5 | Worked explanation traces data flow from input through intermediate state to output | `Verify [data-testid="explanation-input"], [data-testid="explanation-intermediate"], and [data-testid="explanation-output"]` | `{"inputAlt":"Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches","inputDesc":"<script>alert(1)</script>","childType":"string","bypass":"TRUE (Safe)","outputText":"<script>alert(1)</script>","scriptCount":"0"}` | `{"inputAlt":"Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches","inputDesc":"<script>alert(1)</script>","childType":"string","bypass":"TRUE (Safe)","outputText":"<script>alert(1)</script>","scriptCount":"0"}` | **PASS** |
| 6 | Alternate XSS payload (<img src=x onerror=...>) renders safely as text without execution | `Click [data-testid="payload-img-btn"] and assert DOM text safety` | `{"text":"<img src=x onerror=alert(\"hacked\") />","injectedImgs":0,"dialogs":0}` | `{"text":"<img src=x onerror=alert(\"hacked\") />","injectedImgs":0,"dialogs":0}` | **PASS** |
| 7 | Reset button restores original payload <script>alert(1)</script> cleanly | `Click [data-testid="reset-btn"]` | `<script>alert(1)</script>` | `<script>alert(1)</script>` | **PASS** |
| 8 | Console and page error audit: Zero console errors, page errors, or network failures | `Inspect captured error logs` | `{"consoleErrors":0,"pageErrors":0,"requestFailures":0}` | `{"consoleErrors":0,"pageErrors":0,"requestFailures":0}` | **PASS** |

## Security & Semantic Assertions
- **Script Tags Created in Card:** `0`
- **Alert Dialogs Invoked:** `0`
- **Console Errors:** `0`
- **Page Errors:** `0`
- **Request Failures:** `0`
- **Image Alt Attribute:** `"Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches"`

## Test Execution Details
- **Exact Test Command:** `node 03_Day_Setting_Up/applied-labs/r19-t046/check.mjs`
- **Exit Code:** `0`
- **Overall Result:** **PASSED**

## Tool Versions
- **Node.js:** `v24.18.0`
- **React:** `18.3.1`
- **React DOM:** `18.3.1`
- **Vite:** `5.4.8`
- **Playwright:** `1.49.1`
- **Chromium:** `131.0.6778.33`
