import React, { useState } from 'react'

const emptyValues = { name: '', email: '' }

// ---------- ORIGINAL (the working version) ----------
// State and validation live together in one hook.
export function useFormOriginal() {
  const [values, setValues] = useState(emptyValues)
  const setField = (field, value) => setValues((v) => ({ ...v, [field]: value }))
  const reset = () => setValues(emptyValues)

  // Derived on every render, never stored, so it cannot go stale after reset.
  const validity = {
    name: values.name.trim() !== '',
    email: /^[^@\s]+@[^@\s]+$/.test(values.email),
  }
  return { values, setField, reset, validity, formValid: validity.name && validity.email }
}

// ---------- REFACTORED ----------
// CONTRIBUTION FOCUS: one clearly named responsibility is extracted
// (deriving validity from values) without changing the contract.
export function useValidity(values) {
  const validity = {
    name: values.name.trim() !== '',
    email: /^[^@\s]+@[^@\s]+$/.test(values.email),
  }
  return { validity, formValid: validity.name && validity.email }
}

function useFormValues() {
  const [values, setValues] = useState(emptyValues)
  const setField = (field, value) => setValues((v) => ({ ...v, [field]: value }))
  const reset = () => setValues(emptyValues)
  return { values, setField, reset }
}

// Composition of two small hooks; returns exactly the same shape as the original.
export function useFormRefactored() {
  const { values, setField, reset } = useFormValues()
  const { validity, formValid } = useValidity(values)
  return { values, setField, reset, validity, formValid }
}

// ---------- Shared presentational view ----------
function FormView({ form, version }) {
  const { values, setField, reset, validity, formValid } = form
  const word = (ok) => (ok ? 'valid' : 'invalid')
  return (
    <div data-testid="form" data-version={version}>
      <label>Name <input aria-label="Name" value={values.name} onChange={(e) => setField('name', e.target.value)} /></label>
      <span data-testid="name-validity">{word(validity.name)}</span>
      <br />
      <label>Email <input aria-label="Email" value={values.email} onChange={(e) => setField('email', e.target.value)} /></label>
      <span data-testid="email-validity">{word(validity.email)}</span>
      <p data-testid="form-validity">{word(formValid)}</p>
      <button onClick={reset}>Reset</button>
    </div>
  )
}

function OriginalForm() {
  const form = useFormOriginal()
  return <FormView form={form} version="original" />
}

function RefactoredForm() {
  const form = useFormRefactored()
  return <FormView form={form} version="refactored" />
}

export default function App({ version = 'refactored' }) {
  return (
    <div>
      <h1>Hook composition lab</h1>
      {version === 'original' ? <OriginalForm /> : <RefactoredForm />}
    </div>
  )
}
