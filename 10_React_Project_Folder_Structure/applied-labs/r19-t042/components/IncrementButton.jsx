import React from 'react';

export const IncrementButton = ({ onIncrement, disabled }) => {
  const handleClick = (e) => {
    // Blur to avoid keeping focus so subsequent keys (Space/Enter) are treated as irrelevant keys
    e.currentTarget.blur();
    onIncrement();
  };

  const handleKeyDown = (e) => {
    // Prevent browser default activation on Space / Enter so only the documented key increments
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <button
      data-testid="increment-btn"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      style={{
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#ffffff',
        backgroundColor: disabled ? '#6c757d' : '#0d6efd',
        border: 'none',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 2px 4px rgba(13, 110, 253, 0.3)',
        transition: 'background-color 0.15s ease',
      }}
    >
      Increment (+1) <span style={{ opacity: 0.85, fontSize: '13px' }}>[Shortcut: ArrowUp]</span>
    </button>
  );
};

export default IncrementButton;
