// R19-T040 applied lab: capstone task board (Day 30).
// A fixture-backed board with add, complete and filter actions plus
// accessible feedback (a role="status" live region).
import React, { useState } from 'react';

// The decisive condition: which tasks a filter shows. The focused
// test in check.mjs pins this line — the one-line mutant flips
// `t.done` to `!t.done` in the completed branch, and the test must
// fail on it.
function visibleTasks(tasks, filter) {
  if (filter === 'completed') return tasks.filter((t) => t.done);
  if (filter === 'active') return tasks.filter((t) => !t.done);
  return tasks;
}

export default function Example() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState('all');
  const [feedback, setFeedback] = useState('');

  function addTask() {
    if (title.trim() === '') {
      setFeedback('Task title is required.');
      return;
    }
    setTasks((prev) => [
      ...prev,
      { id: prev.length, title: title.trim(), done: false },
    ]);
    setTitle('');
    setFeedback('Task added.');
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    setFeedback('Task completed.');
  }

  const shown = visibleTasks(tasks, filter);

  return (
    <main>
      <h1>Tasks</h1>
      <label htmlFor="task-input">New task</label>
      <input
        id="task-input"
        data-testid="task-input"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button data-testid="add-button" onClick={addTask}>
        Add task
      </button>
      <p role="status" aria-live="polite" data-testid="feedback">
        {feedback}
      </p>
      <div>
        <button data-testid="filter-all" onClick={() => setFilter('all')}>
          All
        </button>
        <button data-testid="filter-active" onClick={() => setFilter('active')}>
          Active
        </button>
        <button
          data-testid="filter-completed"
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>
      {shown.length === 0 ? (
        <p data-testid="empty-message">No tasks.</p>
      ) : (
        <ul data-testid="task-list">
          {shown.map((t) => (
            <li key={t.id} data-testid={`task-${t.id}`} data-done={String(t.done)}>
              <span>{t.title}</span>{' '}
              <button
                data-testid={`task-${t.id}-toggle`}
                onClick={() => toggleTask(t.id)}
              >
                {t.done ? 'Mark active' : 'Mark done'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
