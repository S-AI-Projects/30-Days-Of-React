import { useCallback, useEffect, useRef, useState } from 'react';

// Hook contract: fetcher(key, { signal }) is injected and returns a promise.
// - A new key resets the loading and error state.
// - A response or error that arrives for an earlier key is ignored.
export function useData(fetcher, key) {
  const [state, setState] = useState({ key: null, status: 'idle', data: null, error: null });

  useEffect(() => {
    if (key === null) {
      setState({ key, status: 'idle', data: null, error: null });
      return undefined;
    }
    let stale = false;
    const controller = new AbortController();
    setState({ key, status: 'loading', data: null, error: null });
    fetcher(key, { signal: controller.signal }).then(
      (data) => {
        if (!stale) setState({ key, status: 'success', data, error: null });
      },
      (error) => {
        if (!stale) setState({ key, status: 'error', data: null, error: error.message });
      },
    );
    return () => {
      stale = true; // ignore anything that arrives after the key changed
      controller.abort(); // and tell the source we no longer care
    };
  }, [fetcher, key]);

  // Never show the previous key's result for a new key, not even for one render.
  if (state.key !== key) {
    return { key, status: key === null ? 'idle' : 'loading', data: null, error: null };
  }
  return state;
}

// Local fixtures: no network calls.
const FIXTURES = { alpha: 'Alpha data', beta: 'Beta data', gamma: 'Gamma data' };
const KEYS = Object.keys(FIXTURES);
const LABELS = { idle: 'Idle', loading: 'Loading', success: 'Success', error: 'Error' };

export default function App() {
  const [key, setKey] = useState(null);
  const [requests, setRequests] = useState([]);
  const pending = useRef(new Map());
  const nextId = useRef(1);

  // Injected data source: every request waits until it is released or failed.
  const fetcher = useCallback((requestKey, { signal }) => {
    const id = nextId.current++;
    setRequests((all) => [...all, { id, key: requestKey, status: 'pending', aborted: false }]);
    signal.addEventListener('abort', () => {
      setRequests((all) =>
        all.map((r) => (r.id === id && r.status === 'pending' ? { ...r, aborted: true } : r)),
      );
    });
    return new Promise((resolve, reject) => {
      pending.current.set(id, { resolve, reject, key: requestKey });
    });
  }, []);

  const { status, data, error } = useData(fetcher, key);

  function settle(id, ok) {
    const request = pending.current.get(id);
    pending.current.delete(id);
    setRequests((all) =>
      all.map((r) => (r.id === id ? { ...r, status: ok ? 'resolved' : 'failed' } : r)),
    );
    if (ok) request.resolve(FIXTURES[request.key]);
    else request.reject(new Error(`Failed to load ${request.key}`));
  }

  return (
    <main>
      <h1>Fixture hook lab</h1>
      <p>
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            data-testid={`key-${k}`}
            aria-pressed={k === key}
            onClick={() => setKey(k)}
          >
            {k}
          </button>
        ))}
      </p>
      <p>
        Status: <output data-testid="status">{LABELS[status]}</output>
      </p>
      {status === 'success' && <p data-testid="data">{data}</p>}
      {status === 'error' && <p data-testid="error">{error}</p>}
      <h2>Requests (injected source)</h2>
      <ul data-testid="requests">
        {requests.map((r) => {
          const summary = `#${r.id} ${r.key}: ${r.status}${r.aborted ? ' (aborted)' : ''}`;
          return (
            <li key={r.id} data-testid={`request-${r.id}`} data-summary={summary}>
              {summary}{' '}
              {r.status === 'pending' && (
                <>
                  <button type="button" data-testid={`release-${r.id}`} onClick={() => settle(r.id, true)}>
                    Release
                  </button>{' '}
                  <button type="button" data-testid={`fail-${r.id}`} onClick={() => settle(r.id, false)}>
                    Fail
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}