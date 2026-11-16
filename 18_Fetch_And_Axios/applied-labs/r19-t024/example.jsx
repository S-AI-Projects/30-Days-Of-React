import { useState } from 'react';

// Invariant: a note is dirty if and only if its draft differs from its saved text.
// "Dirty" is derived from those two values and never stored on its own.
export function isDirty(note) {
  return note.draft !== note.saved;
}

// Local fixtures: no network calls.
const INITIAL_NOTES = [
  { id: 'groceries', title: 'Groceries', saved: 'milk, eggs' },
  { id: 'ideas', title: 'Ideas', saved: 'build a note editor' },
  { id: 'todo', title: 'To do', saved: 'write the check' },
];

export default function App() {
  const [notes, setNotes] = useState(() =>
    INITIAL_NOTES.map((note) => ({ ...note, draft: note.saved })),
  );
  const [selectedId, setSelectedId] = useState(INITIAL_NOTES[0].id);
  const selected = notes.find((note) => note.id === selectedId);

  // Editing touches only the selected note's draft.
  function edit(text) {
    setNotes((all) =>
      all.map((note) => (note.id === selectedId ? { ...note, draft: text } : note)),
    );
  }

  // Saving copies draft to saved for the selected note only.
  function save() {
    setNotes((all) =>
      all.map((note) => (note.id === selectedId ? { ...note, saved: note.draft } : note)),
    );
  }

  return (
    <main>
      <h1>Note editor lab</h1>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                data-testid={`select-${note.id}`}
                aria-pressed={note.id === selectedId}
                onClick={() => setSelectedId(note.id)}
              >
                {note.title}
                {isDirty(note) && (
                  <span data-testid={`dirty-${note.id}`} aria-label="unsaved changes">
                    {' ●'}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <section>
          <h2 data-testid="editor-title">{selected.title}</h2>
          <textarea
            data-testid="editor"
            aria-label="Note text"
            value={selected.draft}
            onChange={(event) => edit(event.target.value)}
          />
          <p>
            <button type="button" data-testid="save" onClick={save}>
              Save
            </button>{' '}
            <output data-testid="status">
              {isDirty(selected) ? 'Unsaved changes' : 'Saved'}
            </output>
          </p>
        </section>
      </div>
    </main>
  );
}