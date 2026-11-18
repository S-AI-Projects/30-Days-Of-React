import React from 'react';
import ReactDOM from 'react-dom/client';
import TaskBoard, { DEFAULT_TASKS_FIXTURE } from './example.jsx';

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(
  <TaskBoard initialTasks={DEFAULT_TASKS_FIXTURE} />
);
