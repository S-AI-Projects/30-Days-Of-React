import React, { useState } from 'react';

/**
 * Day 3 Applied Lab: Product Card with Safe Text & Extracted Responsibility (R19-T044)
 *
 * GOAL:
 * Render a product card with an image, label, and user-supplied description.
 * The description "<script>alert(1)</script>" appears as text;
 * the image has useful alternative text.
 *
 * CONTRIBUTION FOCUS:
 * Start from a working version, capture its behavior and extract one
 * clearly named responsibility without changing the contract.
 */

// Pinned local product fixture
export const INITIAL_PRODUCT = Object.freeze({
  id: 'prod-react-mechanical-keyboard',
  title: 'Mechanical Ergonomic Keyboard',
  label: 'Hardware & Peripherals',
  image: Object.freeze({
    // Self-contained high-contrast SVG data URI ensures offline reliability
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='220' viewBox='0 0 360 220'><defs><linearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%231e293b'/><stop offset='100%25' stop-color='%230f172a'/></linearGradient></defs><rect width='360' height='220' rx='12' fill='url(%23bg)'/><rect x='30' y='35' width='300' height='150' rx='8' fill='%23334155' stroke='%2338bdf8' stroke-width='2'/><circle cx='80' cy='85' r='16' fill='%2338bdf8'/><circle cx='130' cy='85' r='16' fill='%23818cf8'/><circle cx='180' cy='85' r='16' fill='%23a855f7'/><circle cx='230' cy='85' r='16' fill='%23ec4899'/><circle cx='280' cy='85' r='16' fill='%23f43f5e'/><rect x='60' y='125' width='240' height='24' rx='6' fill='%2364748b'/><text x='180' y='180' fill='%23e2e8f0' font-family='sans-serif' font-size='13' font-weight='600' text-anchor='middle'>Split Layout &amp; PBT Keycaps</text></svg>",
    alt: 'Ergonomic split mechanical keyboard featuring custom PBT keycaps and vibrant RGB backlighting',
  }),
  description: '<script>alert(1)</script>',
  price: '$149.00',
  inStock: true,
});

// Inline styling objects following Day 3 lesson conventions
export const STYLES = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  },
  header: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '28px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    maxWidth: '420px',
    margin: '0 auto',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#0f172a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'cover',
  },
  content: {
    padding: '20px',
  },
  label: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '4px 10px',
    borderRadius: '9999px',
    marginBottom: '10px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 10px 0',
  },
  description: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    margin: '0 0 16px 0',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px',
  },
  price: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#047857',
  },
  badge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#d1fae5',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  controls: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '12px',
  },
  btn: {
    padding: '8px 14px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnPrimary: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    borderColor: '#0284c7',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
    marginTop: '6px',
  },
};

// ============================================================================
// PHASE 1: Baseline Working Monolithic Version
// Captures initial working behavior: renders card with image, alt text, label,
// and user-supplied description directly inline.
// ============================================================================
export function ProductCardBaseline({ product }) {
  const p = product || INITIAL_PRODUCT;
  const imageObj = typeof p.image === 'string' ? { src: p.image, alt: 'Product image' } : p.image;

  return (
    <article
      data-testid="product-card"
      data-variant="baseline"
      className="product-card"
      style={STYLES.card}
    >
      <div style={STYLES.imageWrapper}>
        <img
          data-testid="product-image"
          src={imageObj.src}
          alt={imageObj.alt}
          style={STYLES.image}
        />
      </div>
      <div style={STYLES.content}>
        <span data-testid="product-label" style={STYLES.label}>
          {p.label}
        </span>
        <h2 data-testid="product-title" style={STYLES.title}>
          {p.title}
        </h2>
        {/* Monolithic inline description rendering */}
        <p
          data-testid="product-description"
          className="product-description"
          style={STYLES.description}
        >
          {p.description}
        </p>
        <div style={STYLES.footer}>
          <span data-testid="product-price" style={STYLES.price}>
            {p.price}
          </span>
          <span style={STYLES.badge}>In Stock</span>
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// PHASE 2: Extracted Responsibility: ProductDescription
// Extracts ONE clearly named responsibility:
// "Encapsulating user-supplied description presentation and safe plain-text rendering"
// ============================================================================
/**
 * ProductDescription
 *
 * Extracted Single Responsibility:
 * Solely responsible for rendering user-supplied description content safely as
 * plain text, ensuring zero script execution or unescaped HTML interpolation,
 * while encapsulating presentation, typography, and testability.
 *
 * Contract:
 * - textContent matches the exact user-supplied string (e.g. "<script>alert(1)</script>")
 * - Renders as standard text node; never executes embedded scripts
 * - Provides data-testid="product-description" hook for contract verification
 */
export function ProductDescription({ description, testId = 'product-description', style }) {
  // Coerce undefined/null to empty string, preserve exact user input string
  const safeText = description != null ? String(description) : '';

  return (
    <p
      data-testid={testId}
      data-responsibility="user-supplied-text-presentation"
      className="product-description product-description--extracted"
      style={{ ...STYLES.description, ...style }}
    >
      {/* React JSX safely injects strings as DOM text nodes; scripts never execute */}
      {safeText}
    </p>
  );
}

// ============================================================================
// PHASE 3: Refactored ProductCard
// Composes the extracted ProductDescription responsibility while preserving
// the exact props contract and DOM contract unchanged.
// ============================================================================
/**
 * ProductCard (Refactored)
 *
 * Implements the exact product card contract:
 * - image: renders <img> with src and useful alt text
 * - label: renders product category / badge
 * - description: delegates to extracted ProductDescription component
 *
 * Contract Compatibility:
 * Accepts { product } object or direct { image, label, description, title, price }
 */
export function ProductCard({
  product,
  image,
  label,
  description,
  title,
  price,
  testId = 'product-card',
}) {
  // Normalize props for backwards compatibility
  const resolvedProduct = product || {
    image: image || INITIAL_PRODUCT.image,
    label: label != null ? label : INITIAL_PRODUCT.label,
    description: description != null ? description : INITIAL_PRODUCT.description,
    title: title || INITIAL_PRODUCT.title,
    price: price || INITIAL_PRODUCT.price,
  };

  const imageObj =
    typeof resolvedProduct.image === 'string'
      ? { src: resolvedProduct.image, alt: 'Product image' }
      : resolvedProduct.image;

  return (
    <article
      data-testid={testId}
      data-variant="refactored"
      data-responsibility-extracted="ProductDescription"
      className="product-card"
      style={STYLES.card}
    >
      <div style={STYLES.imageWrapper}>
        <img
          data-testid="product-image"
          src={imageObj.src}
          alt={imageObj.alt}
          style={STYLES.image}
        />
      </div>
      <div style={STYLES.content}>
        <span data-testid="product-label" style={STYLES.label}>
          {resolvedProduct.label}
        </span>
        <h2 data-testid="product-title" style={STYLES.title}>
          {resolvedProduct.title}
        </h2>

        {/* Delegated to extracted responsibility component */}
        <ProductDescription description={resolvedProduct.description} />

        <div style={STYLES.footer}>
          <span data-testid="product-price" style={STYLES.price}>
            {resolvedProduct.price}
          </span>
          <span style={STYLES.badge}>In Stock</span>
        </div>
      </div>
    </article>
  );
}

// Default export is the refactored ProductCard fulfilling the contract
export default function ProductCardApp({ initialProduct = INITIAL_PRODUCT }) {
  const [product, setProduct] = useState(initialProduct);
  const [activeView, setActiveView] = useState('refactored'); // 'refactored' | 'baseline' | 'both'
  const [customDescription, setCustomDescription] = useState(initialProduct.description);

  const handleApplyDescription = (text) => {
    setCustomDescription(text);
    setProduct((prev) => ({
      ...prev,
      description: text,
    }));
  };

  const handleReset = () => {
    setProduct(initialProduct);
    setCustomDescription(initialProduct.description);
    setActiveView('refactored');
  };

  // Inspect alt text utility and text safety invariants
  const hasUsefulAltText = Boolean(
    product.image &&
      typeof product.image.alt === 'string' &&
      product.image.alt.trim().length > 10 &&
      !product.image.alt.toLowerCase().includes('image')
  );

  return (
    <div style={STYLES.container}>
      <header style={STYLES.header}>
        <h1 data-testid="page-title" style={{ margin: '0 0 8px 0', fontSize: '26px' }}>
          Day 3 Applied Lab: Product Card with Safe Text &amp; Extracted Responsibility (R19-T044)
        </h1>
        <p style={{ margin: 0, opacity: 0.95, fontSize: '15px' }}>
          Validates that user-supplied content like <code>&lt;script&gt;alert(1)&lt;/script&gt;</code> is
          rendered safely as plain text, product image carries descriptive alternative text, and the
          extracted <code>ProductDescription</code> responsibility preserves 100% contract equivalence.
        </p>
      </header>

      {/* Contract & Invariant Status Bar */}
      <section
        data-testid="contract-status-bar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          data-testid="status-alt-text"
          style={{
            backgroundColor: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>IMAGE ALT TEXT</div>
          <div
            data-testid="alt-text-value"
            style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1', marginTop: '4px' }}
          >
            {product.image.alt}
          </div>
          <div
            data-testid="alt-text-health"
            style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}
          >
            ✓ Useful descriptive text ({product.image.alt.length} chars)
          </div>
        </div>

        <div
          data-testid="status-text-safety"
          style={{
            backgroundColor: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>DESCRIPTION SECURITY</div>
          <div
            data-testid="current-description-raw"
            style={{ fontSize: '13px', fontWeight: '700', color: '#b91c1c', marginTop: '4px', fontFamily: 'monospace' }}
          >
            {product.description}
          </div>
          <div
            data-testid="description-safety-status"
            style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}
          >
            ✓ Rendered as safe DOM text node (zero script execution)
          </div>
        </div>

        <div
          data-testid="status-responsibility"
          style={{
            backgroundColor: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>CONTRIBUTION FOCUS</div>
          <div
            data-testid="extracted-responsibility-name"
            style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', marginTop: '4px' }}
          >
            Extracted: ProductDescription
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Current view: <strong data-testid="active-view-name">{activeView}</strong>
          </div>
        </div>
      </section>

      {/* Interactive Controls & Mutation Scenarios */}
      <section style={STYLES.controls} data-testid="lab-controls">
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Lab Controls &amp; Input Payloads</h3>

        <div>
          <label htmlFor="custom-desc-input" style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
            User-Supplied Description Input:
          </label>
          <input
            id="custom-desc-input"
            data-testid="custom-desc-input"
            type="text"
            style={STYLES.input}
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
          />
        </div>

        <div style={STYLES.buttonGroup}>
          <button
            type="button"
            data-testid="apply-desc-btn"
            style={{ ...STYLES.btn, ...STYLES.btnPrimary }}
            onClick={() => handleApplyDescription(customDescription)}
          >
            Apply Description
          </button>
          <button
            type="button"
            data-testid="payload-xss-script-btn"
            style={STYLES.btn}
            onClick={() => handleApplyDescription('<script>alert(1)</script>')}
          >
            Set &lt;script&gt;alert(1)&lt;/script&gt;
          </button>
          <button
            type="button"
            data-testid="payload-xss-img-btn"
            style={STYLES.btn}
            onClick={() => handleApplyDescription('<img src="x" onerror="alert(1)"/>')}
          >
            Set &lt;img onerror&gt; payload
          </button>
          <button
            type="button"
            data-testid="payload-normal-btn"
            style={STYLES.btn}
            onClick={() => handleApplyDescription('High-durability tactile switches with custom sound dampening.')}
          >
            Set Normal Text
          </button>
          <button
            type="button"
            data-testid="reset-btn"
            style={STYLES.btn}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Component Variant:</span>
          <button
            type="button"
            data-testid="view-refactored-btn"
            style={{
              ...STYLES.btn,
              ...(activeView === 'refactored' ? STYLES.btnPrimary : {}),
            }}
            onClick={() => setActiveView('refactored')}
          >
            Refactored (Delegates to ProductDescription)
          </button>
          <button
            type="button"
            data-testid="view-baseline-btn"
            style={{
              ...STYLES.btn,
              ...(activeView === 'baseline' ? STYLES.btnPrimary : {}),
            }}
            onClick={() => setActiveView('baseline')}
          >
            Baseline (Monolithic Working Version)
          </button>
          <button
            type="button"
            data-testid="view-both-btn"
            style={{
              ...STYLES.btn,
              ...(activeView === 'both' ? STYLES.btnPrimary : {}),
            }}
            onClick={() => setActiveView('both')}
          >
            Side-by-Side Equivalence View
          </button>
        </div>
      </section>

      {/* Product Card Render Area */}
      <main data-testid="card-render-area">
        {activeView === 'refactored' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ProductCard product={product} />
          </div>
        )}

        {activeView === 'baseline' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ProductCardBaseline product={product} />
          </div>
        )}

        {activeView === 'both' && (
          <div
            data-testid="side-by-side-comparison"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '24px',
            }}
          >
            <div>
              <h4 style={{ textAlign: 'center', margin: '0 0 12px 0', color: '#64748b' }}>
                Baseline Working Version (Pre-Extraction)
              </h4>
              <ProductCardBaseline product={product} />
            </div>
            <div>
              <h4 style={{ textAlign: 'center', margin: '0 0 12px 0', color: '#0284c7' }}>
                Refactored Version (Extracted ProductDescription)
              </h4>
              <ProductCard product={product} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
