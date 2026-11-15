// R19-T033 applied lab: conditional rendering (Day 9).
// One ResultView component renders exactly one view from an explicit
// state prop, using if/else — the lesson's first conditional pattern.
// The page renders the component five times, once per state.
import React from 'react';

const ITEMS = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson'];

export function ResultView({ state, testId }) {
  if (state === 'loading') {
    return <p data-testid={testId}>Loading…</p>;
  }
  if (state === 'empty') {
    return <p data-testid={testId}>No results found.</p>;
  }
  if (state === 'success') {
    return (
      <ul data-testid={testId}>
        {ITEMS.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    );
  }
  if (state === 'error') {
    return <p data-testid={testId}>Something went wrong.</p>;
  }
  return <p data-testid={testId}>Unknown view.</p>;
}

export default function Example() {
  return (
    <main>
      <h1>Result views</h1>
      <p>
        One component, five states — each view below is the same ResultView
        with a different state.
      </p>
      <section data-testid="state-list">
        <h2>Loading</h2>
        <ResultView state="loading" testId="view-loading" />
        <h2>Empty</h2>
        <ResultView state="empty" testId="view-empty" />
        <h2>Success</h2>
        <ResultView state="success" testId="view-success" />
        <h2>Error</h2>
        <ResultView state="error" testId="view-error" />
        <h2>Unknown</h2>
        <ResultView state="archived" testId="view-unknown" />
      </section>
    </main>
  );
}
