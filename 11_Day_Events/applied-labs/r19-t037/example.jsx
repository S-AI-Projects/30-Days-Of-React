// R19-T037 applied lab: controlled form validation (Day 11).
// A labelled form with name/email fields and inline validation.
// Blank name or invalid email blocks submit (the button is disabled
// until the form is valid); valid data produces one normalized payload.
// Validity and errors are derived on every render, never stored — see
// the worked explanation in README.md for the input -> state -> output
// trace.
import React, { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(name) {
  return name.trim().length === 0 ? 'Name is required.' : '';
}

function validateEmail(email) {
  const trimmed = email.trim();
  if (trimmed.length === 0) return 'Email is required.';
  return EMAIL_RE.test(trimmed) ? '' : 'Enter a valid email address.';
}

export default function Example() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [payload, setPayload] = useState(null);

  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const valid = nameError === '' && emailError === '';

  function handleNameChange(e) {
    setName(e.target.value);
    setTouchedName(true);
    setPayload(null);
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
    setTouchedEmail(true);
    setPayload(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    setPayload({ name: name.trim(), email: email.trim().toLowerCase() });
  }

  return (
    <main>
      <h1>Contact form</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="name-input">Name</label>
          <input
            id="name-input"
            data-testid="name-input"
            type="text"
            value={name}
            onChange={handleNameChange}
          />
          {touchedName && nameError !== '' && (
            <p data-testid="name-error">{nameError}</p>
          )}
        </div>
        <div>
          <label htmlFor="email-input">Email</label>
          <input
            id="email-input"
            data-testid="email-input"
            type="text"
            value={email}
            onChange={handleEmailChange}
          />
          {touchedEmail && emailError !== '' && (
            <p data-testid="email-error">{emailError}</p>
          )}
        </div>
        <button type="submit" data-testid="submit-button" disabled={!valid}>
          Submit
        </button>
      </form>
      {payload !== null && (
        <pre data-testid="payload">{JSON.stringify(payload)}</pre>
      )}
    </main>
  );
}
