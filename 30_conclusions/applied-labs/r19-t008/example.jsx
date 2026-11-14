import React, { useRef, useState } from 'react';

const INITIAL_TASKS = [
  { id: 1, text: 'Write docs', completed: false },
  { id: 2, text: 'Ship demo', completed: true },
];

export default function TaskBoardLab() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const nextId = useRef(3);

  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const addTask = () => {
    const value = newTask.trim();
    if (!value) {
      setError('Task cannot be blank.');
      return;
    }

    const task = { id: nextId.current++, text: value, completed: false };
    setTasks((current) => [...current, task]);
    setNewTask('');
    setError('');
  };

  const toggleTask = (taskId) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '640px' }}>
      <h2>Task Board</h2>

      <div id="task-form" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          id="task-input"
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          placeholder="Add a task"
          aria-label="Task name"
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button id="add-task-btn" type="button" onClick={addTask}>
          Add Task
        </button>
      </div>

      {error && (
        <p id="error-message" style={{ color: 'crimson', marginBottom: '0.75rem' }}>
          {error}
        </p>
      )}

      <div id="filters" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button id="filter-all" type="button" onClick={() => setFilter('all')}>
          All
        </button>
        <button id="filter-active" type="button" onClick={() => setFilter('active')}>
          Active
        </button>
        <button id="filter-completed" type="button" onClick={() => setFilter('completed')}>
          Completed
        </button>
      </div>

      <ul id="task-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {visibleTasks.map((task) => (
          <li
            key={task.id}
            id={`task-${task.id}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: '1px solid #e5e5e5',
            }}
          >
            <span
              id={`task-text-${task.id}`}
              style={{
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? '#666' : '#111',
              }}
            >
              {task.text}
            </span>

            <button
              id={`complete-${task.id}`}
              type="button"
              onClick={() => toggleTask(task.id)}
            >
              {task.completed ? 'Undo' : 'Complete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
