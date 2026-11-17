import React, { useState, useMemo } from 'react';
import { CATS } from './fixture.mjs';

export default function CatGallery() {
  const [filter, setFilter] = useState('');

  // Derived filtered cats using local fixture data only - no external API
  const filteredCats = useMemo(() => {
    const trimmed = filter.trim().toLowerCase();
    if (!trimmed) {
      return CATS;
    }
    return CATS.filter((cat) => cat.origin.toLowerCase() === trimmed);
  }, [filter]);

  const handleClear = () => {
    setFilter('');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 data-testid="page-title" style={styles.title}>
          Cat Gallery: Origin Filtering Lab (R19-T041)
        </h1>
        <p style={styles.subtitle}>
          Day 19 Applied Lab: Filter local cat records by origin without external APIs.
        </p>
      </header>

      <section style={styles.controlsSection}>
        <div style={styles.inputGroup}>
          <label htmlFor="origin-filter" style={styles.label}>
            Filter by Country of Origin:
          </label>
          <input
            id="origin-filter"
            type="text"
            data-testid="origin-filter"
            placeholder="Type origin (e.g. Egypt, Japan, Brazil)..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="button"
            data-testid="btn-filter-egypt"
            onClick={() => setFilter('Egypt')}
            style={{
              ...styles.btn,
              ...(filter.toLowerCase() === 'egypt' ? styles.btnActive : {}),
            }}
          >
            Egypt
          </button>
          <button
            type="button"
            data-testid="btn-filter-japan"
            onClick={() => setFilter('Japan')}
            style={{
              ...styles.btn,
              ...(filter.toLowerCase() === 'japan' ? styles.btnActive : {}),
            }}
          >
            Japan
          </button>
          <button
            type="button"
            data-testid="btn-filter-brazil"
            onClick={() => setFilter('Brazil')}
            style={{
              ...styles.btn,
              ...(filter.toLowerCase() === 'brazil' ? styles.btnActive : {}),
            }}
          >
            Brazil
          </button>
          <button
            type="button"
            data-testid="clear-filter"
            onClick={handleClear}
            style={styles.btnClear}
          >
            Clear Filter
          </button>
        </div>

        <div style={styles.statusRow}>
          <span data-testid="cat-count" style={styles.countText}>
            Showing {filteredCats.length} of {CATS.length} cats
          </span>
          {filter.trim() && (
            <span data-testid="active-filter-badge" style={styles.badge}>
              Active filter: <strong>{filter.trim()}</strong>
            </span>
          )}
        </div>
      </section>

      <main style={styles.gallery}>
        {filteredCats.length === 0 ? (
          <div data-testid="empty-message" style={styles.emptyState}>
            <p style={styles.emptyTitle}>No cats found for origin "{filter.trim()}".</p>
            <p style={styles.emptySubtitle}>
              Try filtering by <strong>Egypt</strong> or <strong>Japan</strong>, or clear the filter.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredCats.map((cat) => (
              <article key={cat.id} data-testid="cat-card" style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 data-testid="cat-name" style={styles.catName}>
                    {cat.name}
                  </h3>
                  <span data-testid="cat-origin" style={styles.originTag}>
                    {cat.origin}
                  </span>
                </div>
                <p style={styles.temperament}>
                  <em>Temperament:</em> {cat.temperament}
                </p>
                <p style={styles.catDesc}>{cat.description}</p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#2d3748',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  header: {
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '16px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#718096',
    margin: 0,
  },
  controlsSection: {
    backgroundColor: '#f7fafc',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid #edf2f7',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#4a5568',
  },
  input: {
    padding: '10px 14px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  btn: {
    padding: '8px 16px',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#cbd5e0',
    backgroundColor: '#ffffff',
    color: '#4a5568',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnActive: {
    backgroundColor: '#3182ce',
    color: '#ffffff',
    borderColor: '#3182ce',
  },
  btnClear: {
    padding: '8px 16px',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    cursor: 'pointer',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '1px solid #e2e8f0',
  },
  countText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#4a5568',
  },
  badge: {
    fontSize: '0.8rem',
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  gallery: {
    marginTop: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  catName: {
    fontSize: '1.2rem',
    fontWeight: '700',
    margin: 0,
    color: '#2b6cb0',
  },
  originTag: {
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: '#feebc8',
    color: '#7b341e',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  temperament: {
    fontSize: '0.85rem',
    color: '#4a5568',
    margin: '0 0 8px 0',
  },
  catDesc: {
    fontSize: '0.875rem',
    color: '#718096',
    margin: 0,
    lineHeight: 1.4,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#fffaf0',
    borderRadius: '8px',
    border: '1px dashed #dd6b20',
  },
  emptyTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#c05621',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    fontSize: '0.9rem',
    color: '#718096',
    margin: 0,
  },
};
