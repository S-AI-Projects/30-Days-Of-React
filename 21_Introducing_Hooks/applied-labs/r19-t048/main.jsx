import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { DEFAULT_INITIAL_COUNT } from './example.jsx';

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(
  <App initialCountProp={DEFAULT_INITIAL_COUNT} />
);
