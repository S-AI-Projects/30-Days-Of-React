import React, { useState, useEffect } from 'react';

export function simulateRequest(query) {
  // Deterministic local delay injection:
  // query 'Alpha' takes 250ms (slow)
  // query 'Beta' takes 50ms (fast)
  const delay = query === 'Alpha' ? 250 : 50;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Result for ${query}`);
    }, delay);
  });
}

export function DataFetcher({ query, requestFn = simulateRequest, onStateUpdate }) {
  const [state, setState] = useState({
    status: 'idle',
    result: null,
  });

  useEffect(() => {
    let isMounted = true;

    // Boundary check for empty or whitespace-only input
    if (!query || query.trim() === '') {
      setState({ status: 'idle', result: 'Enter a valid query' });
      onStateUpdate?.('idle', 'Enter a valid query');
      return;
    }

    setState({ status: 'loading', result: null });
    onStateUpdate?.('loading', null);

    requestFn(query).then((data) => {
      // Prevent stale results: only update state if component is still mounted and this effect is active
      if (isMounted) {
        setState({ status: 'success', result: data });
        onStateUpdate?.('success', data);
      }
    });

    return () => {
      // Cleanup hook: mark unmounted/inactive to drop stale responses
      isMounted = false;
    };
  }, [query, requestFn]);

  return (
    <div data-testid="fetcher-container" style={{ border: '1px solid #ccc', padding: '16px' }}>
      <p>
        Status: <span data-testid="status">{state.status}</span>
      </p>
      <p>
        Result: <span data-testid="result">{state.result || 'No data'}</span>
      </p>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(true);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px' }}>
      <h1>Day 13: Lifecycle Request Cleanup (R19-T052)</h1>
      <p>Contract: Prevent stale response overwriting and state updates after unmount.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button data-testid="btn-query-empty" onClick={() => setQuery('')}>
          Empty Query
        </button>
        <button data-testid="btn-query-alpha" onClick={() => setQuery('Alpha')}>
          Query A (Slow)
        </button>
        <button data-testid="btn-query-beta" onClick={() => setQuery('Beta')}>
          Query B (Fast)
        </button>
        <button data-testid="btn-toggle-mount" onClick={() => setMounted((m) => !m)}>
          {mounted ? 'Unmount Fetcher' : 'Mount Fetcher'}
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        Current Query: <strong data-testid="current-query">{query || '(empty)'}</strong>
      </div>

      {mounted ? <DataFetcher query={query} /> : <div data-testid="unmounted-msg">Fetcher Unmounted</div>}
    </div>
  );
}
