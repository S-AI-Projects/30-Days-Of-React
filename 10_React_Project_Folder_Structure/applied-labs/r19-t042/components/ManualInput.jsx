import React, { useState } from 'react';

export const ManualInput = ({ min = 0, max = 10, onSetValue, onReset }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleApply = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();

    // Check empty-input boundary
    if (trimmed === '') {
      setError(`Error: Input cannot be empty. Value must be an integer between ${min} and ${max}.`);
      return;
    }

    // Check integer format (strictly digits, optionally leading -)
    if (!/^-?\d+$/.test(trimmed)) {
      setError(`Error: Invalid input "${inputValue}". Value must be an integer between ${min} and ${max}.`);
      return;
    }

    const parsed = parseInt(trimmed, 10);

    // Check bounds
    if (isNaN(parsed) || parsed < min || parsed > max) {
      setError(`Error: Invalid input "${inputValue}". Value must be an integer between ${min} and ${max}.`);
      return;
    }

    // Valid within boundary
    setError('');
    onSetValue(parsed);
    setInputValue('');
  };

  const handleResetClick = () => {
    setError('');
    setInputValue('');
    onReset();
  };

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #ced4da',
        backgroundColor: '#ffffff',
      }}
    >
      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
        Boundary &amp; Input Validation Sandbox
      </div>
      <form onSubmit={handleApply} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          data-testid="manual-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Enter integer (${min}-${max})`}
          style={{
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            fontSize: '14px',
            flex: '1',
            minWidth: '180px',
          }}
        />
        <button
          type="submit"
          data-testid="apply-manual-btn"
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#198754',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Set Value
        </button>
        <button
          type="button"
          data-testid="reset-btn"
          onClick={handleResetClick}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#dc3545',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Reset to {min}
        </button>
      </form>

      {error && (
        <div
          data-testid="validation-error"
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ManualInput;
