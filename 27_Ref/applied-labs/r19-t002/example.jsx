import React, { useState, useRef, useEffect } from 'react'

/**
 * Applied Lab R19-T002: Dialog Focus Management with Boundary Validation
 *
 * Implements ref-driven focus management for an accessible dialog-like panel:
 * 1. Opening dialog focuses the labelled input via ref.
 * 2. Closing dialog restores focus to the trigger element via ref.
 * 3. Uncontrolled typing maintains 0 extraneous re-renders.
 * 4. Boundary behavior: empty/whitespace submissions are rejected, showing an
 *    explicit error and retaining input focus without dismissing dialog.
 */
export function FocusDialog({ onSave }) {
  const [isOpen, setIsOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastSubmitted, setLastSubmitted] = useState('')

  // Stable DOM refs
  const triggerRef = useRef(null)
  const inputRef = useRef(null)

  // Render tracker to verify typing causes 0 re-renders
  const renderCountRef = useRef(0)
  renderCountRef.current += 1

  // Focus management on open/close boundary
  useEffect(() => {
    if (isOpen) {
      // Focus input when dialog opens
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleOpen = () => {
    setErrorMessage('')
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setErrorMessage('')
    // Restore focus to trigger element
    setTimeout(() => {
      triggerRef.current?.focus()
    }, 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const rawValue = inputRef.current ? inputRef.current.value : ''
    const trimmed = rawValue.trim()

    // Boundary check: empty or whitespace-only input
    if (!trimmed) {
      setErrorMessage('Input cannot be empty. Please provide valid text.')
      inputRef.current?.focus()
      return
    }

    // Valid submission: commit value, close dialog, restore focus
    setLastSubmitted(trimmed)
    setErrorMessage('')
    setIsOpen(false)
    if (onSave) onSave(trimmed)
    setTimeout(() => {
      triggerRef.current?.focus()
    }, 0)
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '520px', margin: '20px auto' }}>
      <h2>Ref Focus Management Lab (R19-T002)</h2>
      <p style={{ color: '#555' }}>
        Render count: <strong data-testid="render-count">{renderCountRef.current}</strong>
      </p>

      {/* Trigger button */}
      <button
        type="button"
        ref={triggerRef}
        data-testid="trigger-btn"
        onClick={handleOpen}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          cursor: 'pointer',
          borderRadius: '4px',
          border: '1px solid #1976d2',
          backgroundColor: '#1976d2',
          color: '#fff',
        }}
      >
        Open Dialog
      </button>

      {lastSubmitted && (
        <p style={{ marginTop: '12px' }}>
          Last submitted: <span data-testid="last-submitted">{lastSubmitted}</span>
        </p>
      )}

      {/* Dialog overlay / panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          data-testid="dialog-panel"
          style={{
            marginTop: '16px',
            padding: '20px',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <h3 id="dialog-title" style={{ marginTop: 0 }}>
            Enter Feedback
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label
                htmlFor="feedback-input"
                style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}
              >
                Feedback Note:
              </label>
              <input
                id="feedback-input"
                ref={inputRef}
                data-testid="dialog-input"
                type="text"
                defaultValue=""
                placeholder="Type your feedback..."
                style={{
                  width: '100%',
                  padding: '8px',
                  boxSizing: 'border-box',
                  border: errorMessage ? '1px solid #d32f2f' : '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>

            {errorMessage && (
              <p
                data-testid="error-message"
                style={{ color: '#d32f2f', margin: '4px 0 12px 0', fontSize: '13px' }}
              >
                {errorMessage}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                data-testid="submit-btn"
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Submit
              </button>
              <button
                type="button"
                data-testid="close-btn"
                onClick={handleClose}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#757575',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return <FocusDialog />
}
