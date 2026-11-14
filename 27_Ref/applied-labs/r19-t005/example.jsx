import React, { useRef, useState, useCallback } from 'react';

/**
 * R19-T005 — Day 27: ref focus management — deterministic fixture lab
 *
 * Contract:
 *  1. When the dialog panel opens, focus moves to the labelled input inside it.
 *  2. When the dialog panel closes, focus is restored to the trigger button.
 *  3. Normal typing inside the input does NOT cause any ref-driven re-renders
 *     (the ref itself is never stored in state).
 *
 * Deterministic fixture design:
 *  - All behaviour is driven by explicit user events (open / close / type).
 *  - No timers, random data, or network calls are used, so two isolated test
 *    runs will always produce byte-for-byte identical DOM snapshots and render
 *    counts.
 */

export default function FocusDialogLab() {
  const [isOpen, setIsOpen]     = useState(false);
  const [renderCount, setRenderCount] = useState(0);

  // Refs — intentionally NOT stored in state so typing never triggers re-render
  const triggerRef = useRef(null);
  const inputRef   = useRef(null);

  // Track renders only via a ref-counter that increments on every render
  const renderCounterRef = useRef(0);
  renderCounterRef.current += 1;

  const open = useCallback(() => {
    setIsOpen(true);
    setRenderCount(c => c + 1);
    // Focus will be applied in a layout effect after the panel mounts
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setRenderCount(c => c + 1);
    // Restore focus to trigger after state settles
    requestAnimationFrame(() => {
      if (triggerRef.current) triggerRef.current.focus();
    });
  }, []);

  // Move focus into dialog when it opens
  React.useLayoutEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h2>Ref Focus Management — Deterministic Fixture Lab</h2>

      {/* Trigger */}
      <button
        ref={triggerRef}
        id="open-btn"
        onClick={open}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        Open Dialog
      </button>

      {/* Dialog panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Demo dialog"
          id="dialog-panel"
          style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '2px solid #333',
            borderRadius: '4px',
            maxWidth: '360px',
          }}
        >
          <label htmlFor="dialog-input">Your name:</label>
          <br />
          <input
            ref={inputRef}
            id="dialog-input"
            type="text"
            style={{ marginTop: '0.5rem', width: '100%' }}
          />
          <br />
          <button
            id="close-btn"
            onClick={close}
            style={{ marginTop: '0.75rem' }}
          >
            Close Dialog
          </button>
        </div>
      )}

      {/* Observability — render count exposed for test assertions */}
      <p id="render-count" style={{ marginTop: '1rem', color: '#555' }}>
        Component renders: <span id="render-count-value">{renderCounterRef.current}</span>
      </p>
    </div>
  );
}
