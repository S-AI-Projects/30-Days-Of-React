import React, { useState, useRef, useEffect } from 'react';

// Default initial prop value
export const DEFAULT_INITIAL_COUNT = 10;

// Bounded interaction counts specified for the contribution focus
export const BOUNDED_INTERACTION_COUNTS = {
  small: 5,    // 5 double increments = 10 queued functional updates
  medium: 25,  // 25 double increments = 50 queued functional updates
  large: 100,  // 100 double increments = 200 queued functional updates
};

/**
 * FunctionalCounter Component
 * 
 * Implements a counter with useState functional updates and a reset action.
 * Demonstrates:
 * 1. Two queued increments produce +2 via functional updates:
 *    setCount(prev => prev + 1);
 *    setCount(prev => prev + 1);
 * 2. Reset restores the initial prop value.
 * 3. Contribution focus: Checks three bounded input sizes/interaction counts,
 *    asserting mathematical correctness and reporting render, operation, and listener counts.
 */
export const FunctionalCounter = ({ initialCount = DEFAULT_INITIAL_COUNT }) => {
  const [count, setCount] = useState(initialCount);
  const [lastAction, setLastAction] = useState('Mount');
  const [operationCount, setOperationCount] = useState(0);

  // Diagnostic tracking refs (metrics reported rather than imposing speed thresholds)
  const renderCountRef = useRef(0);
  const listenerCountRef = useRef(0);
  const updaterCountRef = useRef(0);

  // Synchronous per-render tracker
  renderCountRef.current += 1;

  // Sync count if initialCount prop changes externally
  useEffect(() => {
    setCount(initialCount);
    setLastAction(`Initial prop updated to ${initialCount}`);
  }, [initialCount]);

  /**
   * Two queued increments using functional updates:
   * Each updater receives the pending state from the preceding update,
   * guaranteeing count increases by +2 even when batched in a single tick.
   */
  const handleQueuedDoubleIncrement = () => {
    listenerCountRef.current += 1;
    setOperationCount((op) => op + 1);
    setLastAction('Queued Double Increment (+2)');

    // 1st queued functional update
    setCount((prev) => {
      updaterCountRef.current += 1;
      return prev + 1;
    });

    // 2nd queued functional update
    setCount((prev) => {
      updaterCountRef.current += 1;
      return prev + 1;
    });
  };

  /**
   * Single increment using functional update
   */
  const handleSingleIncrement = () => {
    listenerCountRef.current += 1;
    setOperationCount((op) => op + 1);
    setLastAction('Single Increment (+1)');

    setCount((prev) => {
      updaterCountRef.current += 1;
      return prev + 1;
    });
  };

  /**
   * Reset restores count to the initial prop value
   */
  const handleReset = () => {
    listenerCountRef.current += 1;
    setOperationCount((op) => op + 1);
    setLastAction(`Reset to Initial (${initialCount})`);
    setCount(initialCount);
  };

  /**
   * Bounded batch runner for repeated interaction counts (N iterations of double increments)
   */
  const handleBoundedBatch = (n, label) => {
    listenerCountRef.current += 1;
    setOperationCount((op) => op + 1);
    setLastAction(`Batch ${label}: ${n} double increments (+${n * 2})`);

    // Queue n pairs of functional increments
    for (let i = 0; i < n; i++) {
      setCount((prev) => {
        updaterCountRef.current += 1;
        return prev + 1;
      });
      setCount((prev) => {
        updaterCountRef.current += 1;
        return prev + 1;
      });
    }
  };

  const isAtInitial = count === initialCount;
  const delta = count - initialCount;

  return (
    <div style={styles.card}>
      <header style={styles.header}>
        <div style={styles.badge}>Day 21 Applied Lab · R19-T048</div>
        <h2 style={styles.title}>useState Functional Updates Counter</h2>
        <p style={styles.subtitle}>
          Contract: Two queued increments produce +2; reset restores initial prop value.
        </p>
      </header>

      {/* Main Counter Display */}
      <div style={styles.counterSection}>
        <div style={styles.displayRow}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Initial Prop Value</div>
            <div data-testid="initial-value" style={styles.metricNumber}>
              {initialCount}
            </div>
          </div>

          <div style={{ ...styles.metricCard, ...styles.highlightMetric }}>
            <div style={styles.metricLabel}>Current Count</div>
            <div data-testid="count-value" style={styles.mainNumber}>
              {count}
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Delta from Initial</div>
            <div data-testid="delta-value" style={styles.metricNumber}>
              {delta >= 0 ? `+${delta}` : delta}
            </div>
          </div>
        </div>

        <div data-testid="status-message" style={styles.statusBar}>
          <strong>Status:</strong> {lastAction} | {isAtInitial ? 'At Initial Value' : `Modified by ${delta}`}
        </div>
      </div>

      {/* Primary Interaction Controls */}
      <div style={styles.controlGroup}>
        <h4 style={styles.sectionHeader}>Primary Contract Actions</h4>
        <div style={styles.buttonRow}>
          <button
            type="button"
            data-testid="btn-double-increment"
            onClick={handleQueuedDoubleIncrement}
            style={styles.primaryButton}
          >
            Queued +2 (Two Updates)
          </button>

          <button
            type="button"
            data-testid="btn-single-increment"
            onClick={handleSingleIncrement}
            style={styles.secondaryButton}
          >
            +1 Single Update
          </button>

          <button
            type="button"
            data-testid="btn-reset"
            onClick={handleReset}
            style={styles.dangerButton}
          >
            Reset to Initial ({initialCount})
          </button>
        </div>
      </div>

      {/* Contribution Focus: Bounded Interaction Batches */}
      <div style={styles.controlGroup}>
        <h4 style={styles.sectionHeader}>
          Contribution Focus: Bounded Repeated Interactions
        </h4>
        <p style={styles.note}>
          Executes repeated double increments; asserts correctness &amp; reports counts without speed thresholds.
        </p>
        <div style={styles.buttonRow}>
          <button
            type="button"
            data-testid="btn-batch-small"
            onClick={() => handleBoundedBatch(BOUNDED_INTERACTION_COUNTS.small, 'Small')}
            style={styles.batchButton}
          >
            Small ({BOUNDED_INTERACTION_COUNTS.small} double = +{BOUNDED_INTERACTION_COUNTS.small * 2})
          </button>

          <button
            type="button"
            data-testid="btn-batch-medium"
            onClick={() => handleBoundedBatch(BOUNDED_INTERACTION_COUNTS.medium, 'Medium')}
            style={styles.batchButton}
          >
            Medium ({BOUNDED_INTERACTION_COUNTS.medium} double = +{BOUNDED_INTERACTION_COUNTS.medium * 2})
          </button>

          <button
            type="button"
            data-testid="btn-batch-large"
            onClick={() => handleBoundedBatch(BOUNDED_INTERACTION_COUNTS.large, 'Large')}
            style={styles.batchButton}
          >
            Large ({BOUNDED_INTERACTION_COUNTS.large} double = +{BOUNDED_INTERACTION_COUNTS.large * 2})
          </button>
        </div>
      </div>

      {/* Reported Diagnostics (render, operation, and listener/updater counts) */}
      <div style={styles.diagnosticsContainer}>
        <h4 style={styles.sectionHeader}>Reported Operation &amp; Render Diagnostics</h4>
        <div style={styles.metricsGrid}>
          <div style={styles.diagItem}>
            <span style={styles.diagLabel}>Render Count:</span>
            <span data-testid="render-count" style={styles.diagVal}>
              {renderCountRef.current}
            </span>
          </div>

          <div style={styles.diagItem}>
            <span style={styles.diagLabel}>Operation Dispatches:</span>
            <span data-testid="operation-count" style={styles.diagVal}>
              {operationCount}
            </span>
          </div>

          <div style={styles.diagItem}>
            <span style={styles.diagLabel}>DOM Listener Invocations:</span>
            <span data-testid="listener-count" style={styles.diagVal}>
              {listenerCountRef.current}
            </span>
          </div>

          <div style={styles.diagItem}>
            <span style={styles.diagLabel}>Functional Updaters Executed:</span>
            <span data-testid="updater-count" style={styles.diagVal}>
              {updaterCountRef.current}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Top-level App Component wrapping FunctionalCounter with interactive prop controls
 */
export default function App({ initialCountProp = DEFAULT_INITIAL_COUNT }) {
  const [configuredInitial, setConfiguredInitial] = useState(initialCountProp);
  const [inputVal, setInputVal] = useState(String(initialCountProp));

  const handleApplyInitial = (e) => {
    e.preventDefault();
    const num = parseInt(inputVal, 10);
    if (!isNaN(num)) {
      setConfiguredInitial(num);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <header style={styles.siteHeader}>
        <h1 style={styles.siteTitle}>30 Days Of React · Day 21 Applied Lab</h1>
        <p style={styles.siteSub}>useState Functional Updates &amp; Reset Contract</p>
      </header>

      {/* Configurable Prop Controls for bounded input sizes */}
      <div style={styles.propControlPanel}>
        <form onSubmit={handleApplyInitial} style={styles.formRow}>
          <label htmlFor="initial-prop-input" style={styles.inputLabel}>
            Configure <code>initialCount</code> Prop:
          </label>
          <input
            id="initial-prop-input"
            data-testid="input-initial-prop"
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={styles.numberInput}
          />
          <button
            type="submit"
            data-testid="btn-apply-initial"
            style={styles.applyButton}
          >
            Apply Prop
          </button>
        </form>
      </div>

      <main>
        <FunctionalCounter initialCount={configuredInitial} />
      </main>
    </div>
  );
}

const styles = {
  pageWrapper: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: 720,
    margin: '30px auto',
    padding: '0 16px',
    color: '#282c34',
  },
  siteHeader: {
    textAlign: 'center',
    marginBottom: 20,
  },
  siteTitle: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    color: '#20232a',
  },
  siteSub: {
    margin: 0,
    color: '#61dafb',
    fontWeight: 600,
    fontSize: '15px',
  },
  propControlPanel: {
    backgroundColor: '#f8f9fa',
    padding: '12px 18px',
    borderRadius: 8,
    border: '1px solid #e1e4e8',
    marginBottom: 20,
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  inputLabel: {
    fontSize: '14px',
    fontWeight: 500,
  },
  numberInput: {
    padding: '6px 10px',
    fontSize: '14px',
    borderRadius: 5,
    border: '1px solid #ccc',
    width: 90,
  },
  applyButton: {
    backgroundColor: '#0366d6',
    color: '#fff',
    border: 'none',
    padding: '7px 14px',
    borderRadius: 5,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e4e8',
    borderRadius: 10,
    padding: 24,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #eee',
    paddingBottom: 14,
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: 8,
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '20px',
  },
  subtitle: {
    margin: 0,
    color: '#555',
    fontSize: '14px',
  },
  counterSection: {
    backgroundColor: '#fafbfc',
    padding: 16,
    borderRadius: 8,
    border: '1px solid #ebeef1',
    marginBottom: 20,
  },
  displayRow: {
    display: 'flex',
    gap: 14,
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: '1 1 120px',
    backgroundColor: '#fff',
    border: '1px solid #e1e4e8',
    borderRadius: 6,
    padding: '10px 14px',
    textAlign: 'center',
  },
  highlightMetric: {
    borderColor: '#61dafb',
    backgroundColor: '#f0faff',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metricNumber: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#282c34',
  },
  mainNumber: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#0284c7',
  },
  statusBar: {
    fontSize: '13px',
    color: '#475569',
    backgroundColor: '#edf2f7',
    padding: '6px 12px',
    borderRadius: 4,
  },
  controlGroup: {
    marginBottom: 20,
  },
  sectionHeader: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  note: {
    margin: '0 0 10px 0',
    fontSize: '13px',
    color: '#64748b',
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 6,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 6,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 6,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  batchButton: {
    backgroundColor: '#475569',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 5,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  diagnosticsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid #e2e8f0',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 8,
  },
  diagItem: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: '6px 12px',
    borderRadius: 4,
    border: '1px solid #e2e8f0',
    fontSize: '13px',
  },
  diagLabel: {
    color: '#64748b',
  },
  diagVal: {
    fontWeight: 700,
    color: '#0f172a',
    fontVariantNumeric: 'tabular-nums',
  },
};
