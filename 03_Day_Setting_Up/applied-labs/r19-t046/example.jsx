import React, { useState, useMemo } from 'react';

/**
 * High-resolution local SVG product image as a data URI.
 * Keeps all data local and self-contained (zero network dependencies).
 */
export const KEYBOARD_IMAGE_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="keyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
  </defs>
  <rect width="400" height="240" rx="16" fill="url(#bgGrad)"/>
  <!-- Keyboard Frame -->
  <rect x="30" y="35" width="340" height="170" rx="12" fill="#182234" stroke="#334155" stroke-width="3"/>
  <!-- Key rows -->
  <g fill="#334155">
    <rect x="45" y="50" width="26" height="22" rx="4"/>
    <rect x="76" y="50" width="26" height="22" rx="4"/>
    <rect x="107" y="50" width="26" height="22" rx="4"/>
    <rect x="138" y="50" width="26" height="22" rx="4"/>
    <rect x="169" y="50" width="26" height="22" rx="4"/>
    <rect x="200" y="50" width="26" height="22" rx="4"/>
    <rect x="231" y="50" width="26" height="22" rx="4"/>
    <rect x="262" y="50" width="26" height="22" rx="4"/>
    <rect x="293" y="50" width="26" height="22" rx="4"/>
    <rect x="324" y="50" width="31" height="22" rx="4" fill="url(#accentGrad)"/>
    
    <rect x="45" y="78" width="34" height="22" rx="4"/>
    <rect x="84" y="78" width="26" height="22" rx="4" fill="url(#keyGrad)"/>
    <rect x="115" y="78" width="26" height="22" rx="4" fill="url(#keyGrad)"/>
    <rect x="146" y="78" width="26" height="22" rx="4" fill="url(#keyGrad)"/>
    <rect x="177" y="78" width="26" height="22" rx="4" fill="url(#keyGrad)"/>
    <rect x="208" y="78" width="26" height="22" rx="4"/>
    <rect x="239" y="78" width="26" height="22" rx="4"/>
    <rect x="270" y="78" width="26" height="22" rx="4"/>
    <rect x="301" y="78" width="54" height="22" rx="4"/>

    <rect x="45" y="106" width="42" height="22" rx="4"/>
    <rect x="92" y="106" width="26" height="22" rx="4"/>
    <rect x="123" y="106" width="26" height="22" rx="4"/>
    <rect x="154" y="106" width="26" height="22" rx="4"/>
    <rect x="185" y="106" width="26" height="22" rx="4"/>
    <rect x="216" y="106" width="26" height="22" rx="4"/>
    <rect x="247" y="106" width="26" height="22" rx="4"/>
    <rect x="278" y="106" width="77" height="22" rx="4" fill="url(#accentGrad)"/>

    <!-- Spacebar Row -->
    <rect x="45" y="134" width="46" height="22" rx="4"/>
    <rect x="96" y="134" width="34" height="22" rx="4"/>
    <rect x="135" y="134" width="130" height="22" rx="4" fill="url(#keyGrad)"/>
    <rect x="270" y="134" width="38" height="22" rx="4"/>
    <rect x="313" y="134" width="42" height="22" rx="4"/>
  </g>
  <text x="200" y="188" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="600" letter-spacing="1.5">PRO ERGONOMIC TKL MECHANICAL</text>
</svg>
`.trim());

/**
 * Default product contract matching lesson specifications.
 * Useful alt text describes product semantics; description contains untrusted script text.
 */
export const DEFAULT_PRODUCT = Object.freeze({
  id: 'prod-001',
  label: 'Ergonomic Mechanical Keyboard Pro',
  imageSrc: KEYBOARD_IMAGE_DATA_URI,
  imageAlt: 'Ergonomic mechanical keyboard with custom RGB backlighting and tactile switches',
  description: '<script>alert(1)</script>',
  category: 'Hardware & Peripherals',
  price: '$149.99',
});

/**
 * Pure function: traceDataFlow
 * Provides the worked explanation data model from Input through Intermediate State to Output.
 * This function can be executed directly by tests or rendered by the UI component.
 *
 * @param {Object} input - Raw product input properties.
 * @returns {Object} Complete trace containing input, intermediate state, and expected output metrics.
 */
export function traceDataFlow(input = DEFAULT_PRODUCT) {
  const safeInput = {
    imageSrc: input.imageSrc,
    imageAlt: input.imageAlt,
    label: input.label,
    description: String(input.description ?? ''),
    price: input.price,
    category: input.category,
  };

  // Intermediate state representation in React JSX evaluation
  const intermediateState = {
    stateHolder: 'ProductCardApp.productState',
    childType: typeof safeInput.description,
    isPrimitiveString: typeof safeInput.description === 'string',
    vdomElement: {
      type: 'p',
      props: {
        className: 'product-description',
        'data-testid': 'product-description',
        children: safeInput.description,
      },
    },
    renderingMechanism: 'React Text Interpolation ({description}) -> document.createTextNode()',
    isRawHtmlParsingBypassed: true,
    htmlEntityEscapeRepresentation: safeInput.description
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;'),
    securityInvariant:
      'Strings injected via JSX {expr} never parse as markup; script payloads remain inert text.',
  };

  // Expected output DOM properties
  const expectedOutput = {
    domNodeType: 1, // Node.ELEMENT_NODE
    textChildNodeType: 3, // Node.TEXT_NODE
    renderedText: safeInput.description,
    scriptElementCountInCard: 0,
    hasUsefulAltText: Boolean(safeInput.imageAlt && safeInput.imageAlt.trim().length > 10),
    isScriptExecuted: false,
  };

  return {
    input: safeInput,
    intermediateState,
    expectedOutput,
    timestamp: Date.now(),
  };
}

/**
 * ProductCard: Pure presentational component following Day 3 lesson style.
 * Uses JSX inline styling patterns and safe text interpolation.
 */
export function ProductCard({ product }) {
  const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '440px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const imageContainerStyle = {
    background: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
    borderBottom: '1px solid #e2e8f0',
  };

  const imageStyle = {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'cover',
  };

  const bodyStyle = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const headerRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  };

  const badgeStyle = {
    background: '#e0f2fe',
    color: '#0369a1',
    fontSize: '12px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '9999px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const priceStyle = {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: '20px',
  };

  const labelStyle = {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: '1.3',
  };

  const descriptionBoxStyle = {
    background: '#f8fafc',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  };

  const descLabelStyle = {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  };

  const descriptionStyle = {
    margin: 0,
    fontSize: '15px',
    color: '#334155',
    lineHeight: '1.5',
    wordBreak: 'break-all',
    fontFamily: product.description.includes('<script>') ? 'monospace' : 'inherit',
    background: product.description.includes('<script>') ? '#f1f5f9' : 'transparent',
    padding: product.description.includes('<script>') ? '4px 8px' : '0',
    borderRadius: '4px',
  };

  const safetyNoteStyle = {
    fontSize: '12px',
    color: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
  };

  return (
    <article
      data-testid="product-card"
      style={cardStyle}
      aria-labelledby="product-label-heading"
    >
      <div style={imageContainerStyle}>
        <img
          data-testid="product-image"
          src={product.imageSrc}
          alt={product.imageAlt}
          style={imageStyle}
        />
      </div>
      <div style={bodyStyle}>
        <div style={headerRowStyle}>
          <span style={badgeStyle}>{product.category || 'Product'}</span>
          <span data-testid="product-price" style={priceStyle}>
            {product.price || '$0.00'}
          </span>
        </div>
        <h2 id="product-label-heading" data-testid="product-label" style={labelStyle}>
          {product.label}
        </h2>
        <div style={descriptionBoxStyle}>
          <div style={descLabelStyle}>User-Supplied Description</div>
          {/* Exact safe JSX interpolation: React creates a text node */}
          <p data-testid="product-description" style={descriptionStyle}>
            {product.description}
          </p>
        </div>
        <div data-testid="safety-indicator" style={safetyNoteStyle}>
          <span aria-hidden="true">🛡️</span>
          <span>JSX Text Escaping Active: Markup tags render inertly as text.</span>
        </div>
      </div>
    </article>
  );
}

/**
 * WorkedExplanation: Traces Input -> Intermediate State -> Output
 * Visible in the UI for educational clarity and targeted by automated Playwright checks.
 */
export function WorkedExplanation({ trace }) {
  const containerStyle = {
    marginTop: '32px',
    background: '#0f172a',
    color: '#f8fafc',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
    border: '1px solid #1e293b',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const headingStyle = {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: '#38bdf8',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  };

  const cardStyle = {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '18px',
    border: '1px solid #334155',
  };

  const cardTitleStyle = (color) => ({
    margin: '0 0 10px 0',
    fontSize: '15px',
    fontWeight: '700',
    color: color || '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  const codeBoxStyle = {
    background: '#090d16',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '12px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    color: '#94a3b8',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    margin: '6px 0 0 0',
  };

  const bulletListStyle = {
    margin: '8px 0 0 0',
    paddingLeft: '18px',
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.6',
  };

  return (
    <section data-testid="worked-explanation" style={containerStyle}>
      <h3 style={headingStyle}>
        <span>🔍 Worked Explanation: Input → Intermediate State → Output</span>
      </h3>
      <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
        This trace documents the end-to-end data lifecycle demonstrating how user-supplied input
        containing raw HTML / script markup (<code style={{ color: '#f43f5e' }}>&lt;script&gt;alert(1)&lt;/script&gt;</code>)
        is safely ingested, mapped into the React Virtual DOM, and committed to the browser DOM as pure text.
      </p>

      <div style={gridStyle}>
        {/* Step 1: Input */}
        <div data-testid="explanation-input" style={cardStyle}>
          <h4 style={cardTitleStyle('#38bdf8')}>
            <span>1️⃣ Stage 1: Input</span>
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#cbd5e1' }}>
            Raw data supplied from user or props:
          </p>
          <ul style={bulletListStyle}>
            <li>
              <strong>Label:</strong> <code>{trace.input.label}</code>
            </li>
            <li>
              <strong>Image Alt:</strong> <span data-testid="trace-input-alt">{trace.input.imageAlt}</span>
            </li>
            <li>
              <strong>Raw Description:</strong>{' '}
              <span data-testid="trace-input-description" style={{ color: '#f43f5e', fontWeight: 'bold' }}>
                {trace.input.description}
              </span>
            </li>
          </ul>
          <pre style={codeBoxStyle}>
            {JSON.stringify(
              {
                label: trace.input.label,
                imageAlt: trace.input.imageAlt,
                description: trace.input.description,
              },
              null,
              2
            )}
          </pre>
        </div>

        {/* Step 2: Intermediate State */}
        <div data-testid="explanation-intermediate" style={cardStyle}>
          <h4 style={cardTitleStyle('#a855f7')}>
            <span>2️⃣ Stage 2: Intermediate State</span>
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#cbd5e1' }}>
            React Virtual DOM compilation &amp; transformation:
          </p>
          <ul style={bulletListStyle}>
            <li>
              <strong>Child Node Type:</strong>{' '}
              <code data-testid="trace-child-type">{trace.intermediateState.childType}</code>
            </li>
            <li>
              <strong>Bypass HTML Parser:</strong>{' '}
              <span data-testid="trace-bypass-parser" style={{ color: '#4ade80' }}>
                {trace.intermediateState.isRawHtmlParsingBypassed ? 'TRUE (Safe)' : 'FALSE'}
              </span>
            </li>
            <li>
              <strong>Escaped Representation:</strong>{' '}
              <code data-testid="trace-escaped-html" style={{ color: '#fbbf24' }}>
                {trace.intermediateState.htmlEntityEscapeRepresentation}
              </code>
            </li>
          </ul>
          <pre style={codeBoxStyle}>
            {JSON.stringify(
              {
                mechanism: trace.intermediateState.renderingMechanism,
                vdom: trace.intermediateState.vdomElement,
                securityInvariant: trace.intermediateState.securityInvariant,
              },
              null,
              2
            )}
          </pre>
        </div>

        {/* Step 3: Rendered Output */}
        <div data-testid="explanation-output" style={cardStyle}>
          <h4 style={cardTitleStyle('#4ade80')}>
            <span>3️⃣ Stage 3: Rendered Output</span>
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#cbd5e1' }}>
            Browser DOM verification &amp; safety invariant:
          </p>
          <ul style={bulletListStyle}>
            <li>
              <strong>DOM NodeType:</strong>{' '}
              <code data-testid="trace-output-node-type">{trace.expectedOutput.domNodeType} (ELEMENT_NODE)</code>
            </li>
            <li>
              <strong>Child NodeType:</strong>{' '}
              <code data-testid="trace-output-text-node-type">{trace.expectedOutput.textChildNodeType} (TEXT_NODE)</code>
            </li>
            <li>
              <strong>Rendered Text Content:</strong>{' '}
              <span data-testid="trace-output-text" style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                {trace.expectedOutput.renderedText}
              </span>
            </li>
            <li>
              <strong>Script Elements in Card:</strong>{' '}
              <span data-testid="trace-script-count" style={{ color: '#4ade80', fontWeight: 'bold' }}>
                {trace.expectedOutput.scriptElementCountInCard}
              </span>
            </li>
            <li>
              <strong>Useful Alt Text Present:</strong>{' '}
              <span data-testid="trace-has-alt" style={{ color: '#4ade80', fontWeight: 'bold' }}>
                {trace.expectedOutput.hasUsefulAltText ? 'YES (Valid)' : 'NO'}
              </span>
            </li>
          </ul>
          <pre style={codeBoxStyle}>
            {`// Output Assertion Contract
assert(card.querySelector('script') === null);
assert(descEl.textContent === "${trace.expectedOutput.renderedText}");
assert(imgEl.getAttribute('alt') !== "");`}
          </pre>
        </div>
      </div>
    </section>
  );
}

/**
 * Main application component.
 * Allows interactive mutation of description to verify the invariant live.
 */
export default function ProductCardApp({ initialProduct = DEFAULT_PRODUCT }) {
  const [product, setProduct] = useState(initialProduct);
  const [inputVal, setInputVal] = useState(initialProduct.description);

  // Compute worked explanation trace dynamically on every state update
  const trace = useMemo(() => traceDataFlow(product), [product]);

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    setProduct((prev) => ({ ...prev, description: val }));
  };

  const handleReset = () => {
    setProduct(initialProduct);
    setInputVal(initialProduct.description);
  };

  const handleSetMaliciousImagePayload = () => {
    const payload = '<img src=x onerror=alert("hacked") />';
    setInputVal(payload);
    setProduct((prev) => ({ ...prev, description: payload }));
  };

  const pageContainerStyle = {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
  };

  const controlsBoxStyle = {
    background: '#f1f5f9',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '32px',
    border: '1px solid #cbd5e1',
  };

  const buttonStyle = {
    padding: '8px 16px',
    background: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
    marginRight: '8px',
  };

  const secondaryBtnStyle = {
    ...buttonStyle,
    background: '#475569',
  };

  const textareaStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontFamily: 'monospace',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #94a3b8',
    marginTop: '8px',
    marginBottom: '12px',
    background: '#ffffff',
  };

  return (
    <div style={pageContainerStyle}>
      <header style={{ marginBottom: '28px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
          Day 3 Applied Lab: Product Card Safe Text &amp; Worked Explanation
        </h1>
        <p style={{ margin: 0, color: '#475569', fontSize: '15px' }}>
          Task R19-T046 · Verifying safe JSX text interpolation &amp; accessible media alt attributes
        </p>
      </header>

      {/* Interactive Controls */}
      <section style={controlsBoxStyle} aria-label="Interactive Controls">
        <label htmlFor="user-description-input" style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
          Edit User-Supplied Description (Live Update):
        </label>
        <textarea
          id="user-description-input"
          data-testid="description-input"
          rows={3}
          value={inputVal}
          onChange={handleDescriptionChange}
          style={textareaStyle}
        />
        <div>
          <button
            type="button"
            data-testid="reset-btn"
            onClick={handleReset}
            style={secondaryBtnStyle}
          >
            Reset to Default Payload (&lt;script&gt;alert(1)&lt;/script&gt;)
          </button>
          <button
            type="button"
            data-testid="payload-img-btn"
            onClick={handleSetMaliciousImagePayload}
            style={buttonStyle}
          >
            Test Alternate Payload (&lt;img src=x onerror=...&gt;)
          </button>
        </div>
      </section>

      {/* Product Card */}
      <main>
        <ProductCard product={product} />
      </main>

      {/* Worked Explanation */}
      <WorkedExplanation trace={trace} />
    </div>
  );
}
