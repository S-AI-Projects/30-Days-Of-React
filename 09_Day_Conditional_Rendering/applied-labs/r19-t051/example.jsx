import React, { useState } from 'react';

export function StatusView({ status, data, error }) {
  if (status === 'loading') {
    return <div data-testid="view-loading" role="status">Loading data...</div>;
  }
  if (status === 'empty') {
    return <div data-testid="view-empty" role="status">No items available.</div>;
  }
  if (status === 'error') {
    return <div data-testid="view-error" role="alert">{error || 'An error occurred.'}</div>;
  }
  if (status === 'success') {
    return (
      <ul data-testid="view-success">
        {(data || []).map((item, index) => (
          <li key={item.id || index} data-testid={`item-${item.id || index}`}>
            {item.name || item}
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

export default function App() {
  const [state, setState] = useState({
    status: 'loading',
    data: [],
    error: null,
  });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Day 9 Applied Lab: Conditional Display</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          data-testid="btn-loading"
          onClick={() => setState({ status: 'loading', data: [], error: null })}
        >
          Set Loading
        </button>
        <button
          data-testid="btn-empty"
          onClick={() => setState({ status: 'empty', data: [], error: null })}
        >
          Set Empty
        </button>
        <button
          data-testid="btn-success"
          onClick={() =>
            setState({
              status: 'success',
              data: [
                { id: 1, name: 'First Item' },
                { id: 2, name: 'Second Item' },
              ],
              error: null,
            })
          }
        >
          Set Success
        </button>
        <button
          data-testid="btn-error"
          onClick={() =>
            setState({ status: 'error', data: [], error: 'Failed to fetch items.' })
          }
        >
          Set Error
        </button>
      </div>

      <div data-testid="display-container" style={{ border: '1px solid #ccc', padding: '16px' }}>
        <StatusView status={state.status} data={state.data} error={state.error} />
      </div>
    </div>
  );
}
