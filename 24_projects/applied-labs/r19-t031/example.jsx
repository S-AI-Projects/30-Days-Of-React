import { useMemo, useState } from 'react';

// One field: its value and whether the user has interacted with it.
// Validation lives in the form, not in the field, so a field never
// stores its own validity.
export function useField(initialValue) {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);
  return {
    value,
    touched,
    onChange: (event) => setValue(event.target.value),
    onBlur: () => setTouched(true),
    reset: () => {
      setValue(initialValue);
      setTouched(false);
    },
  };
}

function validateName(value) {
  if (!value.trim()) return 'Name is required.';
  if (value.trim().length < 2) return 'Name needs at least 2 characters.';
  return '';
}

function validateEmail(value) {
  if (!value.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Enter an email like ada@example.com.';
  }
  return '';
}

// The form composes two fields. Validity, errors and the summary are
// derived from the field values with useMemo: they are computed, never
// stored, so they cannot go stale. Reset only restores the field values
// and everything derived follows.
export function useValidatedForm() {
  const name = useField('');
  const email = useField('');
  const [submitted, setSubmitted] = useState(false);

  const nameError = useMemo(() => validateName(name.value), [name.value]);
  const emailError = useMemo(() => validateEmail(email.value), [email.value]);
  const isValid = useMemo(
    () => nameError === '' && emailError === '',
    [nameError, emailError]
  );
  const summary = useMemo(() => {
    if (!name.value.trim() || !email.value.trim()) return '';
    return `${name.value.trim()} — ${email.value.trim()}`;
  }, [name.value, email.value]);

  function reset() {
    name.reset();
    email.reset();
    setSubmitted(false);
  }

  return { name, email, nameError, emailError, isValid, summary, submitted, setSubmitted, reset };
}

export default function Example() {
  const form = useValidatedForm();
  const showNameError = form.name.touched || form.submitted;
  const showEmailError = form.email.touched || form.submitted;

  function handleSubmit(event) {
    event.preventDefault();
    form.setSubmitted(true);
  }

  return (
    <main>
      <h1>Profile form</h1>
      <p data-testid="form-status">
        {form.isValid ? 'Form is valid.' : 'Form is invalid.'}
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Name
          <input
            data-testid="name-input"
            type="text"
            value={form.name.value}
            onChange={form.name.onChange}
            onBlur={form.name.onBlur}
          />
        </label>
        {showNameError && form.nameError && (
          <p data-testid="name-error">{form.nameError}</p>
        )}
        <label>
          Email
          <input
            data-testid="email-input"
            type="email"
            value={form.email.value}
            onChange={form.email.onChange}
            onBlur={form.email.onBlur}
          />
        </label>
        {showEmailError && form.emailError && (
          <p data-testid="email-error">{form.emailError}</p>
        )}
        <button data-testid="submit-button" type="submit">Save profile</button>
        <button data-testid="reset-button" type="button" onClick={form.reset}>Reset</button>
      </form>
      {form.submitted && form.isValid && (
        <p data-testid="success-message">Profile saved.</p>
      )}
      <p data-testid="summary">{form.summary}</p>
    </main>
  );
}
