import { useState } from 'react';

// Validation rules. A blank name or a missing/malformed email blocks the submit.
export function validate({ name, email }) {
  const errors = {};
  // Decisive condition: a name made only of spaces counts as blank.
  if (name.trim() === '') errors.name = 'Name is required';
  const trimmedEmail = email.trim();
  if (trimmedEmail === '') errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errors.email = 'Enter a valid email address';
  return errors;
}

// Normalized payload: trimmed name with single spaces, trimmed lower-case email.
export function normalize({ name, email }) {
  return { name: name.trim().replace(/\s+/g, ' '), email: email.trim().toLowerCase() };
}

export default function App() {
  const [values, setValues] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [payload, setPayload] = useState(null);
  const [submissions, setSubmissions] = useState(0);

  function onChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function onSubmit(event) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setPayload(null); // blocked: no payload is produced
      return;
    }
    setPayload(normalize(values)); // one submit produces one payload
    setSubmissions((count) => count + 1);
  }

  return (
    <main>
      <h1>Form regression lab</h1>
      <form noValidate onSubmit={onSubmit}>
        <p>
          <label htmlFor="name">Name</label>{' '}
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={onChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="name-error"
          />
        </p>
        <p id="name-error" data-testid="name-error" role="alert">
          {errors.name ?? ''}
        </p>
        <p>
          <label htmlFor="email">Email</label>{' '}
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={onChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby="email-error"
          />
        </p>
        <p id="email-error" data-testid="email-error" role="alert">
          {errors.email ?? ''}
        </p>
        <button type="submit">Submit</button>
      </form>
      <p>
        Submissions: <output data-testid="submissions">{submissions}</output>
      </p>
      <pre data-testid="payload">{payload ? JSON.stringify(payload) : 'No payload yet'}</pre>
    </main>
  );
}