import React, { Fragment } from 'react';

export const CounterDisplay = ({ count, min = 0, max = 10 }) => {
  return (
    <Fragment>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '12px',
          border: '1px solid #dee2e6',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6c757d', marginBottom: '8px' }}>
          Current Counter Value
        </div>
        <div
          data-testid="counter-value"
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            lineHeight: 1,
            marginBottom: '8px',
          }}
        >
          {count}
        </div>
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          Boundary Range: [<span data-testid="min-boundary">{min}</span>, <span data-testid="max-boundary">{max}</span>]
        </div>
      </div>
    </Fragment>
  );
};

export default CounterDisplay;
