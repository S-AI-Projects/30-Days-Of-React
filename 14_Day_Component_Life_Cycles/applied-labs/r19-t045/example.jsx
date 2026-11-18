import React, { Component } from 'react';

// ============================================================================
// Fixtures: Repeatable local fixtures covering 200, rejected, and retry success
// Tests make 0 live API calls.
// ============================================================================

export const FIXTURE_200_DATA = Object.freeze([
  { id: 'FIN', name: 'Finland', capital: 'Helsinki', population: 5540720, flag: '🇫🇮' },
  { id: 'SWE', name: 'Sweden', capital: 'Stockholm', population: 10353442, flag: '🇸🇪' },
  { id: 'NOR', name: 'Norway', capital: 'Oslo', population: 5379475, flag: '🇳🇴' },
]);

export const FIXTURE_REJECTED_ERROR = 'Simulated Network Error: Failed to reach endpoint (503 Service Unavailable)';

export const FIXTURE_RETRY_DATA = Object.freeze([
  { id: 'DNK', name: 'Denmark', capital: 'Copenhagen', population: 5831404, flag: '🇩🇰' },
  { id: 'ISL', name: 'Iceland', capital: 'Reykjavik', population: 366425, flag: '🇮🇸' },
]);

export const FIXTURE_RETRY_INITIAL_ERROR = 'Simulated Gateway Failure: Temporary timeout (504 Gateway Timeout)';

// ============================================================================
// Injected Adapters: Network, Time, and Audit / Storage
// Contribution focus: Inject time, storage, events or network where used.
// ============================================================================

/**
 * Creates an injected fetch adapter configured for a specific scenario.
 * @param {'200' | 'rejected' | 'retry-success'} scenario
 * @param {Object} [customFixtures]
 * @returns {Function} fetchAdapter(endpoint, options)
 */
export function createInjectedFetchAdapter(scenario = '200', customFixtures = {}) {
  let attemptCount = 0;

  return async function injectedFetchAdapter(endpoint = '/api/countries', options = {}) {
    attemptCount += 1;

    if (scenario === '200') {
      const data = customFixtures['200'] || FIXTURE_200_DATA;
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => JSON.parse(JSON.stringify(data)),
      };
    }

    if (scenario === 'rejected') {
      const errorMsg = customFixtures['rejected'] || FIXTURE_REJECTED_ERROR;
      const error = new Error(errorMsg);
      error.status = 503;
      throw error;
    }

    if (scenario === 'retry-success') {
      if (attemptCount === 1) {
        const initialError = customFixtures['retry-initial'] || FIXTURE_RETRY_INITIAL_ERROR;
        const error = new Error(initialError);
        error.status = 504;
        throw error;
      }
      const data = customFixtures['retry-success'] || FIXTURE_RETRY_DATA;
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => JSON.parse(JSON.stringify(data)),
      };
    }

    throw new Error(`Unknown scenario: ${scenario}`);
  };
}

/**
 * Default injectable time adapter.
 * Tests can inject a deterministic virtual clock and 0ms delay.
 */
export const defaultTimeAdapter = {
  now: () => Date.now(),
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  formatTimestamp: (ts) => (ts ? new Date(ts).toISOString() : 'Never'),
};

/**
 * Deterministic test time adapter with zero latency and fixed reference clock.
 */
export const testTimeAdapter = {
  now: () => 1700000000000,
  delay: () => Promise.resolve(),
  formatTimestamp: (ts) => (ts ? new Date(ts).toISOString() : 'Never'),
};

/**
 * Injected audit / storage adapter for recording deterministic state transitions.
 */
export function createAuditAdapter() {
  const logEntries = [];
  return {
    record: (entry) => {
      logEntries.push({ ...entry });
    },
    getLogs: () => [...logEntries],
    clear: () => {
      logEntries.length = 0;
    },
  };
}

// ============================================================================
// Core Component: LifecycleDataFetcher (Day 14 Class Lifecycle Alignment)
// Demonstrates componentDidMount, componentDidUpdate, and componentWillUnmount
// ============================================================================

export class LifecycleDataFetcher extends Component {
  constructor(props) {
    super(props);
    this.timeAdapter = props.timeAdapter || defaultTimeAdapter;
    this.state = {
      status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
      data: null,
      error: null,
      loading: false,
      attempts: 0,
      lastStatusCode: null,
      lastTimestamp: null,
    };
    this.isMountedFlag = false;
  }

  componentDidMount() {
    this.isMountedFlag = true;
    this.recordAudit('MOUNT', 'idle', 'component mounted');
    // As taught in Day 14: componentDidMount is the exact lifecycle phase to initiate data fetching
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.scenario !== this.props.scenario || prevProps.fetchAdapter !== this.props.fetchAdapter) {
      this.recordAudit('PROP_CHANGE', this.state.status, `scenario changed to ${this.props.scenario}`);
      this.fetchData(false, true);
    }
  }

  componentWillUnmount() {
    this.isMountedFlag = false;
    this.recordAudit('UNMOUNT', this.state.status, 'component unmounting');
  }

  recordAudit(action, fromStatus, detail) {
    if (this.props.auditAdapter && typeof this.props.auditAdapter.record === 'function') {
      this.props.auditAdapter.record({
        timestamp: this.timeAdapter.now(),
        action,
        fromStatus,
        scenario: this.props.scenario,
        attempts: this.state.attempts,
        detail,
      });
    }
  }

  fetchData = async (isRetry = false, resetAttempts = false) => {
    const nextAttempts = resetAttempts ? 1 : this.state.attempts + 1;
    const fetchFn = this.props.fetchAdapter || createInjectedFetchAdapter(this.props.scenario || '200');

    this.setState({
      loading: true,
      status: 'loading',
      error: null,
      attempts: nextAttempts,
    });

    try {
      // Injected time delay (0ms in test environment)
      if (this.props.simulateDelayMs) {
        await this.timeAdapter.delay(this.props.simulateDelayMs);
      }

      const response = await fetchFn(this.props.endpoint || '/api/countries');

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();

      if (!this.isMountedFlag) return;

      const now = this.timeAdapter.now();
      this.setState({
        loading: false,
        status: 'success',
        data: payload,
        error: null,
        lastStatusCode: response.status || 200,
        lastTimestamp: now,
      });

      this.recordAudit('FETCH_SUCCESS', 'loading', `Received ${Array.isArray(payload) ? payload.length : 1} items`);
    } catch (err) {
      if (!this.isMountedFlag) return;

      const now = this.timeAdapter.now();
      const statusFromErr = err.status || 500;
      this.setState({
        loading: false,
        status: 'error',
        data: null,
        error: err.message || 'Unknown error occurred',
        lastStatusCode: statusFromErr,
        lastTimestamp: now,
      });

      this.recordAudit('FETCH_ERROR', 'loading', err.message);
    }
  };

  handleRetry = () => {
    this.recordAudit('RETRY_CLICK', this.state.status, `Attempting retry #${this.state.attempts + 1}`);
    this.fetchData(true);
  };

  render() {
    const { status, data, error, loading, attempts, lastStatusCode, lastTimestamp } = this.state;
    const { scenario } = this.props;

    return (
      <section
        data-testid="lifecycle-fetcher"
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: '#111827' }}>
              Day 14 Lifecycle Data Fetcher
            </h2>
            <span
              data-testid="scenario-badge"
              style={{
                fontSize: '0.85rem',
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              Scenario: {scenario}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              data-testid="status-badge"
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor:
                  status === 'success' ? '#dcfce7' : status === 'error' ? '#fee2e2' : '#fef3c7',
                color:
                  status === 'success' ? '#15803d' : status === 'error' ? '#b91c1c' : '#b45309',
              }}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Telemetry metadata */}
        <div
          data-testid="telemetry-bar"
          style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            color: '#4b5563',
          }}
        >
          <div>
            <strong>Attempts:</strong> <span data-testid="attempts-count">{attempts}</span>
          </div>
          <div>
            <strong>Last Status:</strong> <span data-testid="last-status-code">{lastStatusCode ?? 'None'}</span>
          </div>
          <div>
            <strong>Last Action:</strong>{' '}
            <span data-testid="last-timestamp">{this.timeAdapter.formatTimestamp(lastTimestamp)}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            data-testid="loading-indicator"
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              backgroundColor: '#f0f9ff',
              border: '1px dashed #0284c7',
              borderRadius: '6px',
              color: '#0369a1',
              fontWeight: 600,
            }}
          >
            ⏳ Fetching data via injected adapter...
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && status === 'error' && (
          <div
            data-testid="error-container"
            style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '6px',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <strong style={{ color: '#991b1b' }}>Request Error Encountered</strong>
            </div>
            <p
              data-testid="error-message"
              style={{ margin: '0 0 1rem 0', color: '#b91c1c', fontSize: '0.95rem', fontFamily: 'monospace' }}
            >
              {error}
            </p>
            <button
              data-testid="retry-btn"
              onClick={this.handleRetry}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Retry Request
            </button>
          </div>
        )}

        {/* Success State */}
        {!loading && status === 'success' && data && (
          <div data-testid="data-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>
                Loaded Records (<span data-testid="data-count">{Array.isArray(data) ? data.length : 1}</span>)
              </h3>
            </div>
            <div data-testid="item-list" style={{ display: 'grid', gap: '0.5rem' }}>
              {Array.isArray(data) ? (
                data.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`item-${item.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>{item.flag}</span>
                      <strong>{item.name}</strong> <span style={{ color: '#6b7280' }}>({item.capital})</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                      Pop: {item.population.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <pre style={{ margin: 0, fontSize: '0.85rem' }}>{JSON.stringify(data, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </section>
    );
  }
}

// ============================================================================
// Top-Level App Component: InjectedFetchApp
// Interactive test harness for selecting fixtures and running isolated trials
// ============================================================================

export default function InjectedFetchApp({
  initialScenario = '200',
  fetchAdapter = null,
  timeAdapter = defaultTimeAdapter,
  auditAdapter = null,
  simulateDelayMs = 0,
}) {
  const [activeScenario, setActiveScenario] = React.useState(initialScenario);
  const [activeAdapter, setActiveAdapter] = React.useState(
    () => fetchAdapter || createInjectedFetchAdapter(initialScenario)
  );
  const [mountKey, setMountKey] = React.useState(1);

  const switchScenario = (scenario) => {
    setActiveScenario(scenario);
    setActiveAdapter(() => createInjectedFetchAdapter(scenario));
  };

  const handleReset = () => {
    switchScenario('200');
    setMountKey((prev) => prev + 1);
  };

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '2rem auto',
        padding: '0 1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 data-testid="page-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#111827' }}>
          Day 14 Applied Lab: Injected Fetch Adapter Life Cycle (R19-T045)
        </h1>
        <p style={{ margin: 0, color: '#4b5563', fontSize: '0.95rem' }}>
          Contract: Loading, error, and retry states with repeatable local fixtures (200, rejected, retry-success).
        </p>
      </header>

      {/* Interactive Scenario Selector Controls */}
      <nav
        aria-label="Scenario Controls"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          justifyContent: 'center',
        }}
      >
        <button
          data-testid="select-scenario-200"
          onClick={() => switchScenario('200')}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: '6px',
            border: activeScenario === '200' ? '2px solid #2563eb' : '1px solid #d1d5db',
            backgroundColor: activeScenario === '200' ? '#eff6ff' : '#ffffff',
            color: activeScenario === '200' ? '#1d4ed8' : '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ✅ Scenario: 200 OK
        </button>

        <button
          data-testid="select-scenario-rejected"
          onClick={() => switchScenario('rejected')}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: '6px',
            border: activeScenario === 'rejected' ? '2px solid #dc2626' : '1px solid #d1d5db',
            backgroundColor: activeScenario === 'rejected' ? '#fef2f2' : '#ffffff',
            color: activeScenario === 'rejected' ? '#b91c1c' : '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ❌ Scenario: Rejected (503)
        </button>

        <button
          data-testid="select-scenario-retry"
          onClick={() => switchScenario('retry-success')}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: '6px',
            border: activeScenario === 'retry-success' ? '2px solid #d97706' : '1px solid #d1d5db',
            backgroundColor: activeScenario === 'retry-success' ? '#fffbeb' : '#ffffff',
            color: activeScenario === 'retry-success' ? '#b45309' : '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🔄 Scenario: Retry Success (504 → 200)
        </button>

        <button
          data-testid="reset-btn"
          onClick={handleReset}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: '6px',
            border: '1px solid #9ca3af',
            backgroundColor: '#f3f4f6',
            color: '#1f2937',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ⏮ Reset
        </button>
      </nav>

      {/* Active Lifecycle Fetcher Component */}
      <LifecycleDataFetcher
        key={`${activeScenario}-${mountKey}`}
        scenario={activeScenario}
        fetchAdapter={activeAdapter}
        timeAdapter={timeAdapter}
        auditAdapter={auditAdapter}
        simulateDelayMs={simulateDelayMs}
      />
    </div>
  );
}
