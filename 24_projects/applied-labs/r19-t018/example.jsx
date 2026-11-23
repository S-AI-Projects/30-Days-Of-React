import React, { useState } from 'react'

const emptyValues = { name: '', email: '' }

// Hook 1: the ONLY source of truth is the field values.
function useFormValues() {
  const [values, setValues] = useState(emptyValues)
  const setField = (field, value) => setValues((v) => ({ ...v, [field]: value }))
  const reset = () => setValues(emptyValues)
  return { values, setField, reset }
}

// Hook 2: everything else is DERIVED from the values on every render,
// never stored, so it cannot go stale after reset.
function useDerivedStatus(values) {
  const errors = {
    name: values.name.trim() === '' ? 'Name is required' : null,
    email:
      values.email === ''
        ? 'Email is required'
        : /^[^@\s]+@[^@\s]+$/.test(values.email)
          ? null
          : 'Email must look like name@host',
  }
  const blank = values.name.trim() === '' && values.email === ''
  // CONTRIBUTION FOCUS: three states. "empty" and "error" are shown first;
  // the next valid input recovers to "valid" without restarting anything.
  const status = blank ? 'empty' : errors.name || errors.email ? 'error' : 'valid'
  return { errors, status }
}

const statusText = {
  empty: 'Empty: fill in the form',
  error: 'Error: fix the fields below',
  valid: 'Valid: ready to submit',
}

export default function App() {
  const { values, setField, reset } = useFormValues()
  const { errors, status } = useDerivedStatus(values)

  return (
    <div>
      <h1>Failure and recovery lab</h1>
      <p data-testid="form-status" data-status={status}>{statusText[status]}</p>
      <label>Name <input aria-label="Name" value={values.name} onChange={(e) => setField('name', e.target.value)} /></label>
      <span data-testid="name-message">{errors.name ?? 'OK'}</span>
      <br />
      <label>Email <input aria-label="Email" value={values.email} onChange={(e) => setField('email', e.target.value)} /></label>
      <span data-testid="email-message">{errors.email ?? 'OK'}</span>
      <br />
      <button onClick={reset}>Reset</button>
    </div>
  )
}
