// 02_Day_Introduction_to_React/applied-labs/r19-t043/example.jsx
// Day 2 Applied Lab: Derive Filtered Total from Props Without Mutation (R19-T043)
// Demonstrates pure data injection into JSX and invariant verification across operations.

import React, { useState, useMemo } from 'react';

// Frozen initial records: paid amounts 10 and 5, plus unpaid 20
export const INITIAL_RECORDS = Object.freeze([
  Object.freeze({ id: 1, label: 'Hosting & Server Maintenance', amount: 10, paid: true }),
  Object.freeze({ id: 2, label: 'Domain Registration Renewal', amount: 5, paid: true }),
  Object.freeze({ id: 3, label: 'Cloud Storage Expansion', amount: 20, paid: false }),
]);

// Pure derivation function: calculates total without mutating records
export function deriveFilteredTotal(records, filterMode = 'paid') {
  if (!Array.isArray(records)) return 0;
  return records
    .filter((r) => {
      if (filterMode === 'paid') return Boolean(r.paid);
      if (filterMode === 'unpaid') return !r.paid;
      return true; // 'all'
    })
    .reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : 0), 0);
}

// Invariant evaluation helper:
// Invariant: Output total strictly equals the sum of records matching the filter predicate,
// and the original supplied records remain unmutated.
export function evaluateInvariant(currentRecords, filterMode, displayedTotal, initialSnapshot) {
  const expectedTotal = deriveFilteredTotal(currentRecords, filterMode);
  const totalMatches = displayedTotal === expectedTotal;

  // Verify non-mutation of initial supplied records
  const initialUnmutated =
    Array.isArray(initialSnapshot) &&
    initialSnapshot.length === 3 &&
    initialSnapshot[0].id === 1 &&
    initialSnapshot[0].amount === 10 &&
    initialSnapshot[0].paid === true &&
    initialSnapshot[1].id === 2 &&
    initialSnapshot[1].amount === 5 &&
    initialSnapshot[1].paid === true &&
    initialSnapshot[2].id === 3 &&
    initialSnapshot[2].amount === 20 &&
    initialSnapshot[2].paid === false;

  return {
    holds: totalMatches && initialUnmutated,
    expectedTotal,
    displayedTotal,
    totalMatches,
    initialUnmutated,
    currentCount: currentRecords.length,
  };
}

export function FilteredTotalSummary({ records, filterMode = 'paid' }) {
  // Pure derivation: No array mutation (no .splice, .sort, or object modification)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterMode === 'paid') return r.paid;
      if (filterMode === 'unpaid') return !r.paid;
      return true;
    });
  }, [records, filterMode]);

  const filteredTotal = useMemo(() => {
    return deriveFilteredTotal(records, filterMode);
  }, [records, filterMode]);

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid #dee2e6',
        marginBottom: '20px',
      }}
    >
      <div style={{ fontSize: '13px', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.5px' }}>
        Filtered Total ({filterMode.toUpperCase()})
      </div>
      <div
        data-testid="filtered-total"
        style={{
          fontSize: '44px',
          fontWeight: '700',
          color: '#0d6efd',
          lineHeight: 1.2,
          margin: '8px 0',
        }}
      >
        {filteredTotal}
      </div>
      <div style={{ fontSize: '13px', color: '#495057' }}>
        Showing <span data-testid="matching-count">{filteredRecords.length}</span> of{' '}
        <span data-testid="total-records-count">{records.length}</span> records
      </div>
    </div>
  );
}

export function FilteredTotalApp({ initialRecords = INITIAL_RECORDS }) {
  // Keep original snapshot to continuously verify non-mutation
  const [snapshot] = useState(() => initialRecords.map((r) => ({ ...r })));
  const [records, setRecords] = useState(initialRecords);
  const [filterMode, setFilterMode] = useState('paid');

  // Derive total directly
  const displayedTotal = deriveFilteredTotal(records, filterMode);

  // Invariant verification
  const invariantCheck = evaluateInvariant(records, filterMode, displayedTotal, snapshot);

  // Non-mutation sequence operations:
  // 1. Add new record immutably using array spread
  const handleAddRecord = () => {
    const newRecord = Object.freeze({
      id: records.length + 1,
      label: 'New API Subscription',
      amount: 30,
      paid: true,
    });
    setRecords((prev) => [...prev, newRecord]);
  };

  // 2. Toggle paid status of record 3 immutably using .map()
  const handleToggleRecord3 = () => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === 3) {
          return Object.freeze({ ...rec, paid: !rec.paid });
        }
        return rec;
      })
    );
  };

  // 3. Reset back to initial records
  const handleReset = () => {
    setRecords(initialRecords);
    setFilterMode('paid');
  };

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        maxWidth: '600px',
        margin: '40px auto',
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e9ecef',
      }}
    >
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1
          data-testid="page-title"
          style={{ fontSize: '22px', fontWeight: '700', color: '#212529', margin: '0 0 6px 0' }}
        >
          Derived Filtered Total from Props
        </h1>
        <p style={{ margin: '0', fontSize: '13px', color: '#6c757d' }}>
          Day 2 Applied Lab (R19-T043) &bull; Pure JSX Data Derivation
        </p>
      </header>

      {/* Invariant Statement Card */}
      <div
        data-testid="invariant-card"
        style={{
          padding: '12px 16px',
          backgroundColor: '#e7f1ff',
          borderRadius: '8px',
          border: '1px solid #b6d4fe',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#084298',
        }}
      >
        <strong>Stated Invariant:</strong> Output Total = &sum;<sub>r &isin; R, match(r)</sub> amount, where input records <em>R</em> remain strictly unmutated.
        <div style={{ marginTop: '6px', fontWeight: '600' }} data-testid="invariant-status">
          {invariantCheck.holds
            ? 'Status: INVARIANT HOLDS (Pure derivation verified, 0 mutations)'
            : 'Status: INVARIANT VIOLATED'}
        </div>
      </div>

      {/* Filter Mode Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          data-testid="filter-paid-btn"
          onClick={() => setFilterMode('paid')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: filterMode === 'paid' ? '#0d6efd' : '#e9ecef',
            color: filterMode === 'paid' ? '#ffffff' : '#495057',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Paid Only
        </button>
        <button
          data-testid="filter-unpaid-btn"
          onClick={() => setFilterMode('unpaid')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: filterMode === 'unpaid' ? '#0d6efd' : '#e9ecef',
            color: filterMode === 'unpaid' ? '#ffffff' : '#495057',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Unpaid Only
        </button>
        <button
          data-testid="filter-all-btn"
          onClick={() => setFilterMode('all')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: filterMode === 'all' ? '#0d6efd' : '#e9ecef',
            color: filterMode === 'all' ? '#ffffff' : '#495057',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          All Records
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
        Active Filter: <strong data-testid="active-filter">{filterMode}</strong>
      </div>

      {/* Derived Summary Component */}
      <FilteredTotalSummary records={records} filterMode={filterMode} />

      {/* Input Records List */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: '#343a40' }}>
          Supplied Records (Input Array length: <span data-testid="input-array-length">{records.length}</span>)
        </div>
        <div data-testid="records-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {records.map((rec) => (
            <div
              key={rec.id}
              data-testid={`record-item-${rec.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                backgroundColor: rec.paid ? '#f8fdf8' : '#fffdf8',
              }}
            >
              <div>
                <span style={{ fontWeight: '600', color: '#212529' }}>{rec.label}</span>
                <span
                  data-testid={`record-status-${rec.id}`}
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: rec.paid ? '#d1e7dd' : '#fff3cd',
                    color: rec.paid ? '#0f5132' : '#664d03',
                  }}
                >
                  {rec.paid ? 'PAID' : 'UNPAID'}
                </span>
              </div>
              <div data-testid={`record-amount-${rec.id}`} style={{ fontWeight: '700', fontSize: '15px' }}>
                ${rec.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Immutable Operation Buttons for Testing Invariant Across Sequences */}
      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          border: '1px dashed #ced4da',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
          Sequential Operations (Preserves Non-Mutation)
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            data-testid="add-record-btn"
            onClick={handleAddRecord}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#198754',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Add Paid ($30)
          </button>
          <button
            data-testid="toggle-record-3-btn"
            onClick={handleToggleRecord3}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#ffc107',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Toggle Rec 3 Paid
          </button>
          <button
            data-testid="reset-btn"
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#dc3545',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilteredTotalApp;
