// R19-T035 applied lab: custom-hook reuse (Day 25).
// useToggle has a stable interface — [value, toggle, setValue, reset] —
// and two independent panels each own one instance of it. Toggling one
// panel never touches the other; set and reset are explicit operations.
// The hook uses no time, storage, events or network, so the only
// fixture is the local operation sequence in fixture.mjs, which the
// check runs twice in two isolated runs and compares.
import React, { useState, useCallback } from 'react';

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const reset = useCallback(() => setValue(initial), [initial]);
  return [value, toggle, setValue, reset];
}

function Panel({ title, initial, testId }) {
  const [value, toggle, setValue, reset] = useToggle(initial);
  return (
    <section data-testid={testId}>
      <h2>{title}</h2>
      <p data-testid={`${testId}-state`}>{value ? 'on' : 'off'}</p>
      <button type="button" data-testid={`${testId}-toggle`} onClick={toggle}>
        Toggle
      </button>
      <button
        type="button"
        data-testid={`${testId}-set-on`}
        onClick={() => setValue(true)}
      >
        Set on
      </button>
      <button
        type="button"
        data-testid={`${testId}-set-off`}
        onClick={() => setValue(false)}
      >
        Set off
      </button>
      <button type="button" data-testid={`${testId}-reset`} onClick={reset}>
        Reset
      </button>
    </section>
  );
}

export default function Example() {
  return (
    <main>
      <h1>Toggle panels</h1>
      <p>
        Two panels, one hook each — the same useToggle, two independent
        instances.
      </p>
      <Panel title="Panel A" initial={false} testId="panel-a" />
      <Panel title="Panel B" initial={true} testId="panel-b" />
    </main>
  );
}
