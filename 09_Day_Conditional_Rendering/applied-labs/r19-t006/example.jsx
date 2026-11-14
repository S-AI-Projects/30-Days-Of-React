import React, { useState } from 'react';

const ITEMS = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Bravo' },
];

function DataStateView({ status, items, onRetry }) {
  switch (status) {
    case 'loading':
      return (
        <section id="loading-view" aria-live="polite">
          <p>Loading your data...</p>
        </section>
      );
    case 'empty':
      return (
        <section id="empty-view" aria-live="polite">
          <p>No items available.</p>
        </section>
      );
    case 'error':
      return (
        <section id="error-view" aria-live="polite">
          <p>Something went wrong. Please try again.</p>
          <button id="retry-btn" type="button" onClick={onRetry}>
            Retry
          </button>
        </section>
      );
    case 'success':
      return (
        <section id="success-view" aria-live="polite">
          <ul id="items-list">
            {items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </section>
      );
    default:
      return null;
  }
}

export default function ConditionalStateLab() {
  const [status, setStatus] = useState('loading');

  const handleRetry = () => {
    setStatus('success');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h2>Conditional Rendering State Lab</h2>

      <div id="state-controls" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button id="loading-btn" type="button" onClick={() => setStatus('loading')}>
          Loading
        </button>
        <button id="empty-btn" type="button" onClick={() => setStatus('empty')}>
          Empty
        </button>
        <button id="success-btn" type="button" onClick={() => setStatus('success')}>
          Success
        </button>
        <button id="error-btn" type="button" onClick={() => setStatus('error')}>
          Error
        </button>
      </div>

      <p id="status-line" style={{ marginTop: '1rem' }}>
        Current state: <strong id="status-value">{status}</strong>
      </p>

      <DataStateView status={status} items={ITEMS} onRetry={handleRetry} />
    </div>
  );
}
