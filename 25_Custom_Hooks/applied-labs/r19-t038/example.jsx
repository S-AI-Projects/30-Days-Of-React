// R19-T038 applied lab: custom-hook reuse, failure and recovery (Day 25).
// The same useToggle hook as R19-T035 — [value, toggle, setValue, reset] —
// used by two independent panels. The difference here is the failure
// path: each panel also takes a typed word ("on" / "off") that sets it
// through the hook's setValue. An invalid word shows an error and
// leaves the panel unchanged; the next valid word recovers, with no
// restart of the example.
import React, { useState, useCallback } from 'react';

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const reset = useCallback(() => setValue(initial), [initial]);
  return [value, toggle, setValue, reset];
}

function parseToggleInput(text) {
  const word = text.trim().toLowerCase();
  if (word === 'on') return true;
  if (word === 'off') return false;
  return null;
}

function Panel({ title, initial, testId }) {
  const [value, toggle, setValue, reset] = useToggle(initial);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function apply() {
    const parsed = parseToggleInput(input);
    if (parsed === null) {
      setError('Enter on or off.');
      return;
    }
    setError('');
    setValue(parsed);
  }

  return (
    <section data-testid={testId}>
      <h2>{title}</h2>
      <p data-testid={`${testId}-state`}>{value ? 'on' : 'off'}</p>
      <button type="button" data-testid={`${testId}-toggle`} onClick={toggle}>
        Toggle
      </button>
      <button type="button" data-testid={`${testId}-reset`} onClick={reset}>
        Reset
      </button>
      <div>
        <label htmlFor={`${testId}-input`}>Set by word</label>
        <input
          id={`${testId}-input`}
          data-testid={`${testId}-input`}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="button" data-testid={`${testId}-apply`} onClick={apply}>
          Apply
        </button>
      </div>
      {error !== '' && <p data-testid={`${testId}-error`}>{error}</p>}
    </section>
  );
}

export default function Example() {
  return (
    <main>
      <h1>Toggle panels</h1>
      <p>
        Two panels, one hook each — the same useToggle, two independent
        instances. Type on or off and press Apply; anything else is an
        error, and the next valid word recovers without restarting.
      </p>
      <Panel title="Panel A" initial={false} testId="panel-a" />
      <Panel title="Panel B" initial={true} testId="panel-b" />
    </main>
  );
}
