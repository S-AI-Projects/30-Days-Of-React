import React from 'react';
import ReactDOM from 'react-dom/client';
import ShortcutCounterApp from './example.jsx';

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ShortcutCounterApp />
  </React.StrictMode>
);
