import React, { useState } from 'react';

// Extracted component with clearly defined responsibility: managing an individual record item and its editing
export function EditableRecordRow({ record, onUpdate, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <li
      data-testid={`record-${record.id}`}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
    >
      <span style={{ minWidth: '90px', fontWeight: 'bold' }}>{record.title}:</span>
      <input
        data-testid={`input-${record.id}`}
        type="text"
        value={record.text}
        onChange={(e) => onUpdate(record.id, e.target.value)}
        aria-label={`Edit ${record.title}`}
      />
      <button
        data-testid={`move-up-${record.id}`}
        disabled={isFirst}
        onClick={() => onMoveUp(record.id)}
      >
        Up
      </button>
      <button
        data-testid={`move-down-${record.id}`}
        disabled={isLast}
        onClick={() => onMoveDown(record.id)}
      >
        Down
      </button>
    </li>
  );
}

export default function App() {
  const [records, setRecords] = useState([
    { id: 'rec-1', title: 'Task Alpha', text: 'Initial Alpha' },
    { id: 'rec-2', title: 'Task Beta', text: 'Initial Beta' },
    { id: 'rec-3', title: 'Task Gamma', text: 'Initial Gamma' },
  ]);

  const handleUpdate = (id, newText) => {
    setRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, text: newText } : rec))
    );
  };

  const handleMoveUp = (id) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [item] = updated.splice(idx, 1);
      updated.splice(idx - 1, 0, item);
      return updated;
    });
  };

  const handleMoveDown = (id) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const updated = [...prev];
      const [item] = updated.splice(idx, 1);
      updated.splice(idx + 1, 0, item);
      return updated;
    });
  };

  const handleReverse = () => {
    setRecords((prev) => [...prev].reverse());
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px' }}>
      <h1>Day 6: Stable List Keys (R19-T056)</h1>
      <p>Contract: Stable IDs preserve input values during reordering with zero key warnings.</p>
      <button data-testid="btn-reverse" onClick={handleReverse} style={{ marginBottom: '16px' }}>
        Reverse Order
      </button>
      <ul data-testid="record-list" style={{ listStyle: 'none', padding: 0 }}>
        {records.map((rec, index) => (
          <EditableRecordRow
            key={rec.id}
            record={rec}
            onUpdate={handleUpdate}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            isFirst={index === 0}
            isLast={index === records.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}
