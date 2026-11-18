import React from 'react';
import ReactDOM from 'react-dom/client';
import InjectedFetchApp from './example.jsx';

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(
  <InjectedFetchApp />
);
