import React, { useState, useCallback } from 'react'

/**
 * useToggle
 * Custom hook providing boolean toggle state with a stable interface.
 *
 * @param {boolean} [initialValue=false] - Initial boolean state.
 * @returns {[boolean, () => void, (val: boolean) => void, () => void] & {
 *   value: boolean,
 *   toggle: () => void,
 *   setTrue: () => void,
 *   setFalse: () => void,
 *   set: (val: boolean) => void,
 *   reset: () => void
 * }}
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(Boolean(initialValue))

  const toggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  const setTrue = useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = useCallback(() => {
    setValue(false)
  }, [])

  const set = useCallback((nextValue) => {
    setValue(Boolean(nextValue))
  }, [])

  const reset = useCallback(() => {
    setValue(Boolean(initialValue))
  }, [initialValue])

  // Support array destructuring [value, toggle, set, reset]
  const tuple = [value, toggle, set, reset]

  // Also attach named helper properties for convenience
  tuple.value = value
  tuple.toggle = toggle
  tuple.setTrue = setTrue
  tuple.setFalse = setFalse
  tuple.set = set
  tuple.reset = reset

  return tuple
}

/**
 * TogglePanel
 * An independent panel component that manages its own toggle state.
 */
export function TogglePanel({ id, title, initialValue = false }) {
  const [isOn, toggle, set, reset] = useToggle(initialValue)

  return (
    <div
      className="panel"
      data-testid={`panel-${id}`}
      id={`panel-${id}`}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        margin: '12px 0',
        backgroundColor: '#fff',
      }}
    >
      <h3>{title}</h3>
      <p>
        Status:{' '}
        <strong
          data-testid={`status-${id}`}
          style={{
            color: isOn ? '#2e7d32' : '#c62828',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: isOn ? '#e8f5e9' : '#ffebee',
          }}
        >
          {isOn ? 'ON' : 'OFF'}
        </strong>
      </p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          data-testid={`btn-toggle-${id}`}
          onClick={toggle}
        >
          Toggle
        </button>
        <button
          type="button"
          data-testid={`btn-set-true-${id}`}
          onClick={() => set(true)}
        >
          Set True
        </button>
        <button
          type="button"
          data-testid={`btn-set-false-${id}`}
          onClick={() => set(false)}
        >
          Set False
        </button>
        <button
          type="button"
          data-testid={`btn-reset-${id}`}
          onClick={reset}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

/**
 * App
 * Renders two independent panels to demonstrate isolated hook states.
 */
export default function App() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '600px',
        margin: '32px auto',
        padding: '0 16px',
      }}
    >
      <header>
        <h1>Custom Hook: useToggle Lab</h1>
        <p style={{ color: '#555' }}>
          Demonstrates state isolation across two independent panels using the{' '}
          <code>useToggle</code> custom hook.
        </p>
      </header>

      <section aria-label="Toggle Panels">
        <TogglePanel id="a" title="Panel A" initialValue={false} />
        <TogglePanel id="b" title="Panel B" initialValue={false} />
      </section>
    </main>
  )
}
