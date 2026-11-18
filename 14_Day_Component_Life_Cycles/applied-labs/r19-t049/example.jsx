// 14_Day_Component_Life_Cycles/applied-labs/r19-t049/example.jsx
// Day 14 Applied Lab: Injected Fetch Adapter with Loading/Error/Retry States (R19-T049)
// Demonstrates React Component Lifecycle methods (componentDidMount, componentDidUpdate, componentWillUnmount)
// using an injected fetch adapter with loading, error, and retry states.

import React from 'react';

/**
 * Deterministic local fixture data (Day 14 Lesson Topic: Countries data fetching)
 * Keeps all data local - zero external network calls.
 */
export const COUNTRIES_FIXTURE = Object.freeze([
  Object.freeze({ id: 1, name: 'Finland', capital: 'Helsinki', population: 5540720, flag: '🇫🇮' }),
  Object.freeze({ id: 2, name: 'Sweden', capital: 'Stockholm', population: 10353442, flag: '🇸🇪' }),
  Object.freeze({ id: 3, name: 'Norway', capital: 'Oslo', population: 5421241, flag: '🇳🇴' }),
]);

/**
 * Fixture Adapter Factory: 200 Success
 * Returns an HTTP 200 OK Response-like structure.
 */
export function createSuccessAdapter(data = COUNTRIES_FIXTURE) {
  return async (url) => {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      url,
      json: async () => JSON.parse(JSON.stringify(data)),
    };
  };
}

/**
 * Fixture Adapter Factory: Rejected Request
 * Simulates a rejected network request (network error).
 */
export function createRejectedAdapter(errorMessage = 'Network error: Failed to fetch') {
  return async () => {
    throw new Error(errorMessage);
  };
}

/**
 * Fixture Adapter Factory: Retry Success
 * Fails on the first `failAttempts` attempts with a rejected promise,
 * and succeeds with HTTP 200 on subsequent attempts.
 */
export function createRetrySuccessAdapter(failAttempts = 1, data = COUNTRIES_FIXTURE) {
  let attempt = 0;
  return async (url) => {
    attempt += 1;
    if (attempt <= failAttempts) {
      throw new Error(`Connection timeout on attempt ${attempt}`);
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      url,
      json: async () => JSON.parse(JSON.stringify(data)),
    };
  };
}

/**
 * CONTRIBUTION FOCUS - DECISIVE CONDITION
 *
 * The decisive condition determines whether an HTTP response returned by the injected
 * fetch adapter is considered a successful operation (HTTP 200 OK). When true, the component
 * populates `state.data` and transitions to `'success'`. When false, it populates
 * `state.error` and transitions to `'error'`.
 *
 * Normal (correct) condition:
 *   Boolean(response && response.ok && response.status === 200)
 *
 * One-line mutant of the decisive condition:
 *   Boolean(response && !response.ok)
 *
 * Under the mutant, a valid HTTP 200 response evaluates to false, causing the component
 * to erroneously fail into the 'error' state despite receiving a 200 OK response.
 */
export function isFetchSuccessful(response) {
  // DECISIVE CONDITION (Line under mutation testing):
  return Boolean(response && response.ok && response.status === 200);
  // MUTANT: return Boolean(response && !response.ok);
}

/**
 * Helper to evaluate decisive condition with optional mutant flag for focused testing.
 */
export function evaluateDecisiveCondition(response, useMutant = false) {
  if (useMutant) {
    // ONE-LINE MUTANT of the decisive condition
    return Boolean(response && !response.ok);
  }
  return isFetchSuccessful(response);
}

/**
 * CountriesFetcher Class Component
 * Implements Day 14 Component Life Cycles:
 * - constructor(): initializes state (idle/loading, empty data/error)
 * - componentDidMount(): triggers initial fetch on mount
 * - componentDidUpdate(): reacts to prop or state updates
 * - componentWillUnmount(): prevents memory leaks and state updates after teardown
 * - render(): renders loading, error (with retry button), or success views
 */
export class CountriesFetcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
      data: null,
      error: null,
      attemptCount: 0,
      lifecycleEvents: ['constructor'],
    };
    this._isMounted = false;
    this._requestId = 0;
  }

  componentDidMount() {
    this._isMounted = true;
    this.recordLifecycle('componentDidMount');
    this.fetchData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.status !== this.state.status) {
      this.recordLifecycle(`componentDidUpdate(status:${this.state.status})`);
    }
    if (prevProps.adapterKey !== this.props.adapterKey) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.recordLifecycle('componentWillUnmount');
  }

  recordLifecycle = (event) => {
    if (this._isMounted) {
      this.setState((prev) => ({
        lifecycleEvents: [...prev.lifecycleEvents, event],
      }));
    }
  };

  fetchData = async () => {
    const {
      fetchAdapter,
      url = '/api/countries',
      checkSuccess = isFetchSuccessful,
      useMutant = false,
    } = this.props;

    const currentRequestId = ++this._requestId;

    if (!fetchAdapter) {
      if (this._isMounted) {
        this.setState((prev) => ({
          status: 'error',
          error: 'No fetchAdapter provided',
          attemptCount: prev.attemptCount + 1,
        }));
      }
      return;
    }

    if (this._isMounted) {
      this.setState((prev) => ({
        status: 'loading',
        error: null,
        attemptCount: prev.attemptCount + 1,
      }));
    }

    try {
      const response = await fetchAdapter(url);

      // Verify this request is still the active one and component remains mounted
      if (!this._isMounted || currentRequestId !== this._requestId) return;

      // DECISIVE CONDITION EVALUATION:
      const decisiveFn = useMutant ? (res) => evaluateDecisiveCondition(res, true) : checkSuccess;
      const isSuccess = decisiveFn(response);

      if (isSuccess) {
        const data = await response.json();
        if (this._isMounted && currentRequestId === this._requestId) {
          this.setState({
            status: 'success',
            data,
            error: null,
          });
        }
      } else {
        const errorMsg = `HTTP Error ${response?.status || 500}: ${response?.statusText || 'Request failed'}`;
        if (this._isMounted && currentRequestId === this._requestId) {
          this.setState({
            status: 'error',
            error: errorMsg,
          });
        }
      }
    } catch (err) {
      if (this._isMounted && currentRequestId === this._requestId) {
        this.setState({
          status: 'error',
          error: err?.message || 'Network request failed',
        });
      }
    }
  };

  handleRetry = () => {
    this.fetchData();
  };

  render() {
    const { status, data, error, attemptCount, lifecycleEvents } = this.state;
    const { label = 'Countries API Request' } = this.props;

    return (
      <div className="fetcher-card" data-testid="fetcher-container">
        <div className="fetcher-header">
          <h3 data-testid="fetcher-label">{label}</h3>
          <div className="badges">
            <span
              className={`status-badge status-${status}`}
              data-testid="status-indicator"
            >
              {status}
            </span>
            <span className="attempt-badge" data-testid="attempt-count">
              Attempts: {attemptCount}
            </span>
          </div>
        </div>

        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="state-box loading-box" data-testid="loading-state">
            <div className="spinner" data-testid="loading-spinner" />
            <p data-testid="loading-message">Fetching data via injected adapter...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="state-box error-box" data-testid="error-state">
            <div className="error-icon">⚠️</div>
            <p className="error-text" data-testid="error-message">
              {error}
            </p>
            <button
              type="button"
              className="btn btn-retry"
              data-testid="retry-btn"
              onClick={this.handleRetry}
            >
              Retry Request
            </button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && data && (
          <div className="state-box success-box" data-testid="success-state">
            <div className="success-meta">
              <span>Loaded countries: </span>
              <strong data-testid="item-count">
                {Array.isArray(data) ? data.length : 0}
              </strong>
            </div>
            <ul className="countries-list" data-testid="countries-list">
              {Array.isArray(data) &&
                data.map((c) => (
                  <li
                    key={c.id}
                    className="country-item"
                    data-testid={`country-item-${c.id}`}
                  >
                    <span className="country-flag">{c.flag}</span>
                    <span
                      className="country-name"
                      data-testid={`country-name-${c.id}`}
                    >
                      {c.name}
                    </span>
                    <span className="country-capital">Capital: {c.capital}</span>
                    <span className="country-pop">
                      Pop: {c.population.toLocaleString()}
                    </span>
                  </li>
                ))}
            </ul>
            <button
              type="button"
              className="btn btn-refetch"
              data-testid="refetch-btn"
              onClick={this.fetchData}
            >
              Refetch
            </button>
          </div>
        )}

        {/* LIFECYCLE AUDIT TRAIL */}
        <div className="lifecycle-audit" data-testid="lifecycle-audit">
          <small>Lifecycle: {lifecycleEvents.slice(-4).join(' → ')}</small>
        </div>
      </div>
    );
  }
}

/**
 * Main Interactive Application Component
 * Allows live browser exploration of the contract:
 * - Scenario 1: 200 OK immediate success
 * - Scenario 2: Rejected request leading to Error state & Retry button
 * - Scenario 3: Retry success (Attempt 1 fails, Attempt 2 succeeds)
 * - Scenario 4: Mutant decisive condition (HTTP 200 erroneously rejected)
 */
export default function App() {
  const [activeScenario, setActiveScenario] = React.useState('200');
  const [scenarioKey, setScenarioKey] = React.useState(0);
  const [useMutant, setUseMutant] = React.useState(false);

  // Maintain scenario-specific adapters
  const adapterMap = React.useMemo(() => {
    return {
      200: {
        label: 'Scenario 1: 200 OK Success Response',
        adapter: createSuccessAdapter(COUNTRIES_FIXTURE),
      },
      rejected: {
        label: 'Scenario 2: Rejected Request (Network Failure)',
        adapter: createRejectedAdapter('Network error: Request failed to connect'),
      },
      retry: {
        label: 'Scenario 3: Retry Success (Fails on Attempt 1, Succeeds on Attempt 2)',
        adapter: createRetrySuccessAdapter(1, COUNTRIES_FIXTURE),
      },
    };
  }, [scenarioKey]);

  const selectScenario = (scenario) => {
    setActiveScenario(scenario);
    setScenarioKey((k) => k + 1);
  };

  const currentConfig = adapterMap[activeScenario] || adapterMap['200'];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 data-testid="page-title">
          Day 14 Applied Lab: Injected Fetch Adapter (R19-T049)
        </h1>
        <p className="subtitle">
          React Component Life Cycles with Injected Fetch Adapters, Loading/Error/Retry States &
          Decisive Condition Mutation Testing
        </p>
      </header>

      {/* SCENARIO SELECTOR CONTROLS */}
      <nav className="scenario-controls" aria-label="Scenario Selector">
        <button
          type="button"
          data-testid="select-scenario-200"
          className={`btn-scenario ${activeScenario === '200' && !useMutant ? 'active' : ''}`}
          onClick={() => {
            setUseMutant(false);
            selectScenario('200');
          }}
        >
          200 OK Success
        </button>
        <button
          type="button"
          data-testid="select-scenario-rejected"
          className={`btn-scenario ${activeScenario === 'rejected' && !useMutant ? 'active' : ''}`}
          onClick={() => {
            setUseMutant(false);
            selectScenario('rejected');
          }}
        >
          Rejected Request
        </button>
        <button
          type="button"
          data-testid="select-scenario-retry"
          className={`btn-scenario ${activeScenario === 'retry' && !useMutant ? 'active' : ''}`}
          onClick={() => {
            setUseMutant(false);
            selectScenario('retry');
          }}
        >
          Retry Success
        </button>
        <button
          type="button"
          data-testid="toggle-mutant-btn"
          className={`btn-scenario btn-mutant ${useMutant ? 'active' : ''}`}
          onClick={() => {
            setUseMutant((m) => !m);
            setScenarioKey((k) => k + 1);
          }}
        >
          {useMutant ? 'Mutant: ACTIVE (!response.ok)' : 'Mutant: OFF (Normal 200)'}
        </button>
        <button
          type="button"
          data-testid="reset-scenario-btn"
          className="btn-scenario btn-reset"
          onClick={() => {
            setUseMutant(false);
            selectScenario('200');
          }}
        >
          Reset
        </button>
      </nav>

      {/* ACTIVE SCENARIO METADATA */}
      <div className="active-scenario-info" data-testid="scenario-info">
        <span>Active Scenario: </span>
        <strong data-testid="active-scenario-name">
          {useMutant ? 'Mutant Mode: Inverted Decisive Condition' : currentConfig.label}
        </strong>
      </div>

      {/* CORE FETCHER COMPONENT INSTANCE */}
      <main className="main-content">
        <CountriesFetcher
          key={`${activeScenario}-${scenarioKey}-${useMutant}`}
          adapterKey={`${activeScenario}-${scenarioKey}-${useMutant}`}
          label={useMutant ? 'Mutant Decisive Condition Test (200 Inverted)' : currentConfig.label}
          fetchAdapter={currentConfig.adapter}
          useMutant={useMutant}
        />
      </main>

      <footer className="app-footer">
        <p>
          30 Days of React · Day 14 Component Life Cycles · Applied Lab R19-T049 · Zero Live API Calls
        </p>
      </footer>
    </div>
  );
}
