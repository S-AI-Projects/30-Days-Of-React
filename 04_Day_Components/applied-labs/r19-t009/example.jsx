import React, { useState } from 'react';

/**
 * StatusBadge Component
 * Reusable status indicator supporting pending, success, error, and an explicit fallback for unknown status.
 */
export function StatusBadge({ status, label }) {
  const configs = {
    pending: { text: label || 'Pending', bg: '#fef3c7', color: '#92400e', border: '#f59e0b' },
    success: { text: label || 'Success', bg: '#d1fae5', color: '#065f46', border: '#10b981' },
    error:   { text: label || 'Error',   bg: '#fee2e2', color: '#991b1b', border: '#ef4444' },
  };

  const current = configs[status] || {
    text: label || 'Unknown Status',
    bg: '#f3f4f6',
    color: '#374151',
    border: '#9ca3af',
  };

  return (
    <span
      className={`status-badge status-${status || 'unknown'}`}
      data-status={status || 'unknown'}
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: 600,
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        margin: '0.25rem',
      }}
    >
      {current.text}
    </span>
  );
}

export default function ScaleExperimentLab() {
  const [scale, setScale] = useState(5);
  const [renderCount, setRenderCount] = useState(1);

  // Generate deterministic fixtures across three bounded input scales (5, 20, 50)
  const statuses = ['pending', 'success', 'error', 'unknown', 'invalid-custom'];

  const items = Array.from({ length: scale }, (_, i) => ({
    id: i + 1,
    status: statuses[i % statuses.length],
    label: `Item ${i + 1} (${statuses[i % statuses.length]})`,
  }));

  const handleScaleChange = (newScale) => {
    setScale(newScale);
    setRenderCount((prev) => prev + 1);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '720px' }}>
      <h2>Day 4: Component Reuse — Input-Scale Experiment</h2>
      <p>
        Testing reusable <code>StatusBadge</code> rendering across bounded input scales.
      </p>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button id="scale-5" type="button" onClick={() => handleScaleChange(5)}>Scale: 5</button>
        <button id="scale-20" type="button" onClick={() => handleScaleChange(20)}>Scale: 20</button>
        <button id="scale-50" type="button" onClick={() => handleScaleChange(50)}>Scale: 50</button>
      </div>

      <div id="metrics" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
        <p style={{ margin: '0.25rem 0' }}>Current Scale: <strong id="current-scale">{scale}</strong></p>
        <p style={{ margin: '0.25rem 0' }}>Rendered Badges: <strong id="badge-count">{items.length}</strong></p>
        <p style={{ margin: '0.25rem 0' }}>Render Operations: <strong id="operation-count">{renderCount}</strong></p>
      </div>

      <div id="badge-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {items.map((item) => (
          <StatusBadge key={item.id} status={item.status} label={item.label} />
        ))}
      </div>
    </div>
  );
}
