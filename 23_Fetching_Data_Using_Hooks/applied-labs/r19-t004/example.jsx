import React, { useState, useEffect, useRef } from 'react'

/**
 * Injected asynchronous mock data source with configurable latency
 */
export const defaultFetcher = (key) => {
  return new Promise((resolve, reject) => {
    // Key A is slow (300ms)
    // Key B is fast (50ms)
    // Key C causes error (60ms)
    const latencies = { A: 300, B: 50, C: 60 }
    const delay = latencies[key] !== undefined ? latencies[key] : 100

    setTimeout(() => {
      if (key === 'C') {
        reject(new Error('Network error: failed to fetch key C'))
      } else {
        resolve({ key, payload: `Resolved payload for ${key}`, timestamp: Date.now() })
      }
    }, delay)
  })
}

/**
 * Custom hook: useCancellableFetch
 * Handles cancellation and stale-response discard for an injected async source.
 * Invariant:
 * 1. Changing `key` resets `loading` to true and `error` to null.
 * 2. Late responses for superseded keys are discarded.
 * 3. `data` always reflects the active key.
 */
export function useCancellableFetch(key, fetcher = defaultFetcher) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(key))
  const [error, setError] = useState(null)
  const [prevKey, setPrevKey] = useState(key)
  const activeKeyRef = useRef(key)

  // React idiomatic pattern: reset state immediately during render when key changes
  if (key !== prevKey) {
    setPrevKey(key)
    setLoading(Boolean(key))
    setError(null)
    setData(null)
  }

  useEffect(() => {
    activeKeyRef.current = key

    if (!key) {
      return
    }

    let isSubscribed = true

    fetcher(key)
      .then((res) => {
        // Discard stale response if unmounted or if key changed
        if (isSubscribed && activeKeyRef.current === key) {
          setData(res)
          setLoading(false)
          setError(null)
        }
      })
      .catch((err) => {
        if (isSubscribed && activeKeyRef.current === key) {
          setError(err.message || 'Error occurred')
          setLoading(false)
          setData(null)
        }
      })

    return () => {
      isSubscribed = false
    }
  }, [key, fetcher])

  return { data, loading, error, activeKey: activeKeyRef.current }
}

/**
 * Demo component
 */
export function CancellableFetchDemo({ fetcher = defaultFetcher }) {
  const [selectedKey, setSelectedKey] = useState('A')
  const { data, loading, error } = useCancellableFetch(selectedKey, fetcher)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '560px', margin: '20px auto' }}>
      <h2>Cancellable Fetch Hook Lab (R19-T004)</h2>
      <p style={{ color: '#555' }}>
        Exercises cancellation and stale-response rejection when rapidly switching query keys.
      </p>

      {/* Query Key Selection Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="btn-key-a"
          onClick={() => setSelectedKey('A')}
          style={{ padding: '8px 16px', fontWeight: selectedKey === 'A' ? 'bold' : 'normal' }}
        >
          Select Key A (Slow 300ms)
        </button>
        <button
          type="button"
          data-testid="btn-key-b"
          onClick={() => setSelectedKey('B')}
          style={{ padding: '8px 16px', fontWeight: selectedKey === 'B' ? 'bold' : 'normal' }}
        >
          Select Key B (Fast 50ms)
        </button>
        <button
          type="button"
          data-testid="btn-key-c"
          onClick={() => setSelectedKey('C')}
          style={{ padding: '8px 16px', fontWeight: selectedKey === 'C' ? 'bold' : 'normal' }}
        >
          Select Key C (Error 60ms)
        </button>
      </div>

      {/* Invariant status display */}
      <div
        data-testid="status-panel"
        style={{
          padding: '16px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#fafafa',
          minHeight: '120px',
        }}
      >
        <p>
          Active Key: <strong data-testid="active-key">{selectedKey}</strong>
        </p>

        {loading && (
          <p data-testid="loading-state" style={{ color: '#1976d2' }}>
            Loading data for key {selectedKey}...
          </p>
        )}

        {error && (
          <p data-testid="error-state" style={{ color: '#d32f2f' }}>
            Error: {error}
          </p>
        )}

        {data && !loading && !error && (
          <div data-testid="data-container">
            <h4 data-testid="data-key">{data.key}</h4>
            <p data-testid="data-payload">{data.payload}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return <CancellableFetchDemo />
}
