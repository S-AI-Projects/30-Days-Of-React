import React, { useState, useEffect, useRef } from 'react';

export const CAT_PAGES_DATA = {
  1: [
    { id: 'c1', name: 'Siamese', origin: 'Thailand' },
    { id: 'c2', name: 'Persian', origin: 'Iran' },
  ],
  2: [
    { id: 'c3', name: 'Maine Coon', origin: 'United States' },
    { id: 'c4', name: 'Bengal', origin: 'United States' },
  ],
  3: [
    { id: 'c5', name: 'British Shorthair', origin: 'United Kingdom' },
    { id: 'c6', name: 'Sphynx', origin: 'Canada' },
  ],
};

export default function CatGallery() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [cats, setCats] = useState([]);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Track failure for page 2 so first visit fails and subsequent retry recovers
  const failedPage2Attempts = useRef(0);

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');
    setError(null);

    // Delay simulation: Page 3 takes 250ms (slow), others take 50ms
    const delay = page === 3 ? 250 : 50;

    const timer = setTimeout(() => {
      // Simulate network failure on first visit to page 2
      if (page === 2 && failedPage2Attempts.current === 0) {
        failedPage2Attempts.current += 1;
        if (isMounted) {
          setStatus('error');
          setError('Failed to load page 2 cats.');
        }
        return;
      }

      const data = CAT_PAGES_DATA[page] || [];
      if (isMounted) {
        setCats(data);
        setStatus('success');
      }
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [page, retryTrigger]);

  const handleRetry = () => {
    setRetryTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', maxWidth: '640px' }}>
      <h1>Day 20: Cat Gallery Failure Recovery (R19-T058)</h1>
      <p>Contract: Pagination, failure recovery via retry, and stale response prevention.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          data-testid="btn-page-1"
          onClick={() => setPage(1)}
          style={{ fontWeight: page === 1 ? 'bold' : 'normal' }}
        >
          Page 1
        </button>
        <button
          data-testid="btn-page-2"
          onClick={() => setPage(2)}
          style={{ fontWeight: page === 2 ? 'bold' : 'normal' }}
        >
          Page 2
        </button>
        <button
          data-testid="btn-page-3"
          onClick={() => setPage(3)}
          style={{ fontWeight: page === 3 ? 'bold' : 'normal' }}
        >
          Page 3
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        Active Page: <span data-testid="current-page">{page}</span> | Status:{' '}
        <span data-testid="status">{status}</span>
      </div>

      {status === 'loading' && <div data-testid="loading-indicator">Loading cats...</div>}

      {status === 'error' && (
        <div data-testid="error-container" style={{ padding: '16px', background: '#ffebee', borderRadius: '4px' }}>
          <p data-testid="error-message" style={{ color: '#d32f2f', margin: '0 0 12px 0' }}>
            {error}
          </p>
          <button data-testid="btn-retry" onClick={handleRetry} style={{ padding: '6px 14px' }}>
            Retry
          </button>
        </div>
      )}

      {status === 'success' && (
        <ul data-testid="cat-list" style={{ listStyle: 'none', padding: 0 }}>
          {cats.map((cat) => (
            <li
              key={cat.id}
              data-testid={`cat-item-${cat.id}`}
              style={{
                padding: '10px 14px',
                marginBottom: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#fafafa',
              }}
            >
              <strong>{cat.name}</strong> — <span>{cat.origin}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
