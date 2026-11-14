import React, { useState, useEffect } from 'react';

/**
 * Simulated fixture API with configurable latency.
 * Simulates out-of-order responses (e.g. query "alpha" is slow, "beta" is fast).
 */
export function fetchUserData(query) {
  const delays = {
    alpha: 250, // slow response
    beta: 50,   // fast response
  };
  const delay = delays[query] ?? 100;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        query,
        result: `Profile data for ${query.toUpperCase()}`,
        timestamp: Date.now(),
      });
    }, delay);
  });
}

/**
 * UserProfileFetcher Component
 * Demonstrates safe asynchronous lifecycle cleanup.
 */
export function UserProfileFetcher({ query, mutateIgnoreCleanup = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);

    fetchUserData(query).then((response) => {
      // DECISIVE CONDITION:
      // When mutateIgnoreCleanup is false (correct code), stale or unmounted responses are ignored.
      // When mutateIgnoreCleanup is true (mutant code), cleanup is ignored causing stale overwrite.
      if (!mutateIgnoreCleanup && !isSubscribed) {
        return;
      }
      setData(response);
      setLoading(false);
    });

    return () => {
      isSubscribed = false;
    };
  }, [query, mutateIgnoreCleanup]);

  return (
    <div
      id="profile-display"
      style={{
        padding: '1rem',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        background: '#f8fafc',
      }}
    >
      <p id="loading-indicator">Status: {loading ? 'Loading...' : 'Idle'}</p>
      <p id="active-query">Query: {query}</p>
      <p id="resolved-result">
        Result: {data ? data.result : 'None'}
      </p>
    </div>
  );
}

export default function LifecycleCleanupLab() {
  const [query, setQuery] = useState('alpha');
  const [isMounted, setIsMounted] = useState(true);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '640px' }}>
      <h2>Day 13: Lifecycle Request Cleanup Lab</h2>
      <p>Demonstrates race-condition prevention across parameter changes and unmounts.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button id="btn-alpha" type="button" onClick={() => setQuery('alpha')}>
          Query "alpha" (Slow)
        </button>
        <button id="btn-beta" type="button" onClick={() => setQuery('beta')}>
          Query "beta" (Fast)
        </button>
        <button id="btn-toggle-mount" type="button" onClick={() => setIsMounted((m) => !m)}>
          {isMounted ? 'Unmount Fetcher' : 'Mount Fetcher'}
        </button>
      </div>

      <div id="container">
        {isMounted ? (
          <UserProfileFetcher query={query} />
        ) : (
          <p id="unmounted-msg">Fetcher is currently unmounted.</p>
        )}
      </div>
    </div>
  );
}
