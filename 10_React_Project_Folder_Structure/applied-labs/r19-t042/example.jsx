// 10_React_Project_Folder_Structure/applied-labs/r19-t042/example.jsx
// Day 10 Applied Lab: Button and Keyboard Shortcut State Transition (R19-T042)
// Demonstrates component modularity, folder structure, and shared state transition contracts.

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { CounterDisplay } from './components/CounterDisplay.jsx';
import { BoundaryStatus } from './components/BoundaryStatus.jsx';
import { IncrementButton } from './components/IncrementButton.jsx';
import { ShortcutGuide } from './components/ShortcutGuide.jsx';
import { ManualInput } from './components/ManualInput.jsx';

export const MIN_COUNT = 0;
export const MAX_COUNT = 10;
export const DOCUMENTED_KEY = 'ArrowUp';

export function ShortcutCounterApp() {
  const [count, setCount] = useState(MIN_COUNT);

  // Single shared state transition function
  // Enforces exact boundary condition: count cannot exceed MAX_COUNT (10)
  const handleIncrement = useCallback(() => {
    setCount((prev) => {
      if (prev >= MAX_COUNT) {
        return prev; // Boundary condition: state unchanged at maximum
      }
      return prev + 1;
    });
  }, []);

  const handleReset = useCallback(() => {
    setCount(MIN_COUNT);
  }, []);

  const handleSetValue = useCallback((val) => {
    if (typeof val === 'number' && !isNaN(val) && val >= MIN_COUNT && val <= MAX_COUNT) {
      setCount(val);
    }
  }, []);

  // Keyboard shortcut listener
  // Only the DOCUMENTED_KEY triggers the state transition; irrelevant keys leave state unchanged
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore keystrokes when typing inside text inputs or textareas
      if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
        return;
      }

      // Check documented key
      if (event.key === DOCUMENTED_KEY) {
        event.preventDefault();
        handleIncrement();
      }
      // Any other key (irrelevant key) leaves state completely unchanged
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleIncrement]);

  const isAtMax = count >= MAX_COUNT;

  return (
    <Fragment>
      <div
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          maxWidth: '560px',
          margin: '40px auto',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e9ecef',
        }}
      >
        <header style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1
            data-testid="page-title"
            style={{ fontSize: '22px', fontWeight: '700', color: '#212529', margin: '0 0 8px 0' }}
          >
            Button &amp; Shortcut State Transition
          </h1>
          <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
            Day 10 Applied Lab (R19-T042) &bull; Modular Component Structure
          </p>
        </header>

        <BoundaryStatus count={count} min={MIN_COUNT} max={MAX_COUNT} />

        <CounterDisplay count={count} min={MIN_COUNT} max={MAX_COUNT} />

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
          <IncrementButton onIncrement={handleIncrement} disabled={isAtMax} />
        </div>

        <ManualInput
          min={MIN_COUNT}
          max={MAX_COUNT}
          onSetValue={handleSetValue}
          onReset={handleReset}
        />

        <ShortcutGuide documentedKey={DOCUMENTED_KEY} max={MAX_COUNT} />
      </div>
    </Fragment>
  );
}

export default ShortcutCounterApp;
