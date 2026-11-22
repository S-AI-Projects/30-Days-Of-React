import React, { useState } from 'react';

export function QuantityControl({ initialValue = 0, onChange }) {
  const [quantity, setQuantity] = useState(initialValue);

  const increment = () => {
    setQuantity((prev) => {
      const next = prev + 1;
      onChange?.(next);
      return next;
    });
  };

  const decrement = () => {
    setQuantity((prev) => {
      const next = Math.max(0, prev - 1);
      onChange?.(next);
      return next;
    });
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      <button
        data-testid="btn-dec"
        onClick={decrement}
        style={{ padding: '6px 14px', fontSize: '18px' }}
      >
        -
      </button>
      <span
        data-testid="quantity-value"
        style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '32px', textAlign: 'center' }}
      >
        {quantity}
      </span>
      <button
        data-testid="btn-inc"
        onClick={increment}
        style={{ padding: '6px 14px', fontSize: '18px' }}
      >
        +
      </button>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px' }}>
      <h1>Day 8: State Updates — Quantity Control (R19-T055)</h1>
      <p>Contract: Increment/decrement with a zero lower bound.</p>
      <QuantityControl />
    </div>
  );
}
