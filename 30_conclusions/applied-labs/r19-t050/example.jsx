/**
 * Day 30 Applied Lab: Fixture-Backed Task Board (R19-T050)
 *
 * Lesson Topic: Conclusions (Capstones & Real-World React Foundations)
 * Contract:
 *  - Fixture-backed task board with add, complete, and filter actions plus accessible feedback.
 *  - Add two tasks, complete one, filter completed: exactly one remains.
 *  - Invalid blank tasks are rejected with accessible error feedback.
 *
 * Contribution Focus:
 *  - Implement the required behavior from the explicit contract;
 *  - Show the smallest useful complete example (pure React, zero external state libraries, accessible semantic HTML).
 */

import React, { useState } from 'react';

/** Default immutable fixture for the task board */
export const DEFAULT_TASKS_FIXTURE = Object.freeze([]);

/** Sample initial fixture demonstrating multi-item state */
export const SAMPLE_TASKS_FIXTURE = Object.freeze([
  { id: 'fixture-task-1', title: 'Review 30 Days of React conclusions', completed: false },
]);

export default function TaskBoard({ initialTasks = DEFAULT_TASKS_FIXTURE }) {
  // State 1: tasks collection backed by local fixture
  const [tasks, setTasks] = useState(() => [...initialTasks]);

  // State 2: controlled input for new task title
  const [newTitle, setNewTitle] = useState('');

  // State 3: filter selection ('all' | 'active' | 'completed')
  const [filter, setFilter] = useState('all');

  // State 4: validation error string or null
  const [errorMessage, setErrorMessage] = useState(null);

  // State 5: accessible feedback announcement for screen readers & status displays
  const [feedbackMessage, setFeedbackMessage] = useState(
    initialTasks.length > 0
      ? `Task board loaded with ${initialTasks.length} initial task(s).`
      : 'Task board ready. Add a task to begin.'
  );

  // Derived visible tasks based on active filter
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'completed') return task.completed;
    if (filter === 'active') return !task.completed;
    return true;
  });

  // Action 1: Add task (rejects invalid blank tasks)
  const handleAddTask = (e) => {
    e.preventDefault();
    const trimmedTitle = newTitle.trim();

    // Contract: invalid blank tasks are rejected
    if (trimmedTitle === '') {
      setErrorMessage('Task title cannot be blank.');
      setFeedbackMessage('Error: Task title cannot be blank.');
      return;
    }

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmedTitle,
      completed: false,
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTitle('');
    setErrorMessage(null);
    setFeedbackMessage(`Task "${trimmedTitle}" added.`);
  };

  // Action 2: Complete / toggle task
  const handleToggleTask = (taskId) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const nextStatus = !targetTask.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextStatus } : t))
    );
    setErrorMessage(null);
    setFeedbackMessage(
      `Task "${targetTask.title}" marked as ${nextStatus ? 'completed' : 'active'}.`
    );
  };

  // Action 3: Filter selection
  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    setErrorMessage(null);
    setFeedbackMessage(`Filter switched to ${nextFilter}.`);
  };

  // Reset to initial fixture
  const handleReset = () => {
    setTasks([...initialTasks]);
    setNewTitle('');
    setFilter('all');
    setErrorMessage(null);
    setFeedbackMessage('Task board reset to initial fixture.');
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <main
      style={{
        maxWidth: '560px',
        margin: '2rem auto',
        padding: '1.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        color: '#222',
      }}
    >
      <header>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>
          Day 30 Applied Lab: Task Board
        </h1>
        <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
          Smallest useful complete example of a fixture-backed task board with accessible feedback.
        </p>
      </header>

      {/* Accessible live feedback region */}
      <div
        id="feedback-region"
        data-testid="feedback-message"
        role={errorMessage ? 'alert' : 'status'}
        aria-live={errorMessage ? 'assertive' : 'polite'}
        style={{
          padding: '0.6rem 0.8rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          fontSize: '0.9rem',
          backgroundColor: errorMessage ? '#ffebee' : '#e8f5e9',
          color: errorMessage ? '#c62828' : '#2e7d32',
          border: `1px solid ${errorMessage ? '#ef9a9a' : '#a5d6a7'}`,
        }}
      >
        {feedbackMessage}
      </div>

      {/* Add task form */}
      <form
        onSubmit={handleAddTask}
        aria-label="Add task form"
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <input
          type="text"
          data-testid="task-input"
          aria-label="New task title"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby="feedback-region"
          placeholder="What needs to be done?"
          value={newTitle}
          onChange={(e) => {
            setNewTitle(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            border: `1px solid ${errorMessage ? '#d32f2f' : '#ccc'}`,
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          data-testid="add-task-btn"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Add Task
        </button>
      </form>

      {/* Filter and control bar */}
      <nav
        aria-label="Task filters"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            data-testid="filter-all"
            aria-pressed={filter === 'all'}
            onClick={() => handleFilterChange('all')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '4px',
              border: '1px solid #bbb',
              backgroundColor: filter === 'all' ? '#1976d2' : '#fff',
              color: filter === 'all' ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            All
          </button>
          <button
            type="button"
            data-testid="filter-active"
            aria-pressed={filter === 'active'}
            onClick={() => handleFilterChange('active')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '4px',
              border: '1px solid #bbb',
              backgroundColor: filter === 'active' ? '#1976d2' : '#fff',
              color: filter === 'active' ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            Active
          </button>
          <button
            type="button"
            data-testid="filter-completed"
            aria-pressed={filter === 'completed'}
            onClick={() => handleFilterChange('completed')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '4px',
              border: '1px solid #bbb',
              backgroundColor: filter === 'completed' ? '#1976d2' : '#fff',
              color: filter === 'completed' ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            Completed
          </button>
        </div>

        <button
          type="button"
          data-testid="reset-btn"
          onClick={handleReset}
          style={{
            padding: '0.35rem 0.7rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#eee',
            color: '#555',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Reset to Fixture
        </button>
      </nav>

      {/* Quantitative Summary / Metrics */}
      <section
        aria-label="Task board summary"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: '#555',
          marginBottom: '1rem',
        }}
      >
        <span>
          Total: <strong data-testid="total-count">{tasks.length}</strong>
        </span>
        <span>
          Active: <strong data-testid="active-count">{activeCount}</strong>
        </span>
        <span>
          Completed: <strong data-testid="completed-count">{completedCount}</strong>
        </span>
        <span>
          Visible: <strong data-testid="visible-count">{visibleTasks.length}</strong>
        </span>
        <span style={{ display: 'none' }} data-testid="current-filter">
          {filter}
        </span>
      </section>

      {/* Task items list */}
      <section aria-label="Task list container">
        {visibleTasks.length === 0 ? (
          <p
            data-testid="empty-state"
            style={{ textAlign: 'center', color: '#777', fontStyle: 'italic', padding: '1rem' }}
          >
            No tasks found for current filter.
          </p>
        ) : (
          <ul
            data-testid="task-list"
            style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {visibleTasks.map((task) => (
              <li
                key={task.id}
                data-testid="task-item"
                data-task-id={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    data-testid="task-toggle"
                    data-toggle-id={task.id}
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                    aria-label={`Mark task "${task.title}" as ${task.completed ? 'active' : 'completed'}`}
                  />
                  <span
                    data-testid="task-title"
                    style={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? '#888' : '#222',
                    }}
                  >
                    {task.title}
                  </span>
                </label>
                <span
                  data-testid="task-status-badge"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    backgroundColor: task.completed ? '#e8f5e9' : '#e3f2fd',
                    color: task.completed ? '#2e7d32' : '#1565c0',
                    fontWeight: '600',
                  }}
                >
                  {task.completed ? 'Completed' : 'Active'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
