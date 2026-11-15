// R19-T034 applied lab: testable component contract (Day 29).
// A controlled SelectableList: the parent owns the selected id, the list
// only reflects it. The invariant the lab states and tests:
// after every operation, the readout, the aria-selected marks and the
// parent state agree — at most one option is selected, and it is the
// one the readout names; a disabled option can never be selected.
import React, { useState } from 'react';

const ITEMS = [
  { id: 'ada', label: 'Ada Lovelace' },
  { id: 'grace', label: 'Grace Hopper', disabled: true },
  { id: 'katherine', label: 'Katherine Johnson' },
];

export function SelectableList({ items, value, onChange, testId }) {
  if (items.length === 0) {
    return <p data-testid={`${testId}-empty`}>No items.</p>;
  }

  function handleKeyDown(event, item) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!item.disabled) onChange(item.id);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const options = Array.from(
        event.currentTarget.parentElement.querySelectorAll('[role="option"]')
      );
      const index = options.indexOf(event.currentTarget);
      const next =
        event.key === 'ArrowDown'
          ? options[Math.min(index + 1, options.length - 1)]
          : options[Math.max(index - 1, 0)];
      if (next) next.focus();
    }
  }

  return (
    <ul role="listbox" data-testid={testId}>
      {items.map((item) => (
        <li
          key={item.id}
          role="option"
          tabIndex={0}
          aria-selected={value === item.id}
          aria-disabled={item.disabled ? true : undefined}
          data-testid={`${testId}-${item.id}`}
          onClick={() => {
            if (!item.disabled) onChange(item.id);
          }}
          onKeyDown={(event) => handleKeyDown(event, item)}
        >
          {item.label}
          {item.disabled ? ' (disabled)' : ''}
        </li>
      ))}
    </ul>
  );
}

export default function Example() {
  const [selected, setSelected] = useState(null);
  const selectedLabel =
    ITEMS.find((item) => item.id === selected)?.label ?? 'none';

  return (
    <main>
      <h1>Selectable list</h1>
      <p data-testid="selected-readout">Selected: {selectedLabel}</p>
      <SelectableList
        items={ITEMS}
        value={selected}
        onChange={setSelected}
        testId="list"
      />
      <div>
        <button
          type="button"
          data-testid="select-ada"
          onClick={() => setSelected('ada')}
        >
          Select Ada
        </button>
        <button
          type="button"
          data-testid="clear-selection"
          onClick={() => setSelected(null)}
        >
          Clear selection
        </button>
      </div>
      <h2>Empty list</h2>
      <SelectableList items={[]} value={null} onChange={() => {}} testId="empty-list" />
    </main>
  );
}
