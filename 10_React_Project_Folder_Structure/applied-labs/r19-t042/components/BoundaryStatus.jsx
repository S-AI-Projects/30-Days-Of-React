import React from 'react';

export const BoundaryStatus = ({ count, min = 0, max = 10 }) => {
  const isAtMax = count >= max;
  const isAtMin = count <= min;

  return (
    <div
      data-testid="boundary-status"
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '16px',
        backgroundColor: isAtMax ? '#fff3cd' : '#e8f5e9',
        border: `1px solid ${isAtMax ? '#ffeeba' : '#c8e6c9'}`,
        color: isAtMax ? '#856404' : '#2e7d32',
      }}
    >
      <strong>Boundary State: </strong>
      {isAtMax ? (
        <span data-testid="boundary-alert">
          Boundary reached: maximum count ({max}) reached. Further increments are blocked.
        </span>
      ) : isAtMin ? (
        <span>At minimum boundary ({min}). Ready to increment.</span>
      ) : (
        <span>Within normal boundary ({min} to {max}).</span>
      )}
    </div>
  );
};

export default BoundaryStatus;
