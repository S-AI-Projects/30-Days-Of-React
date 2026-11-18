import React from 'react';
import ReactDOM from 'react-dom/client';
import FilteredTotalApp, { INITIAL_RECORDS } from './example.jsx';

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <FilteredTotalApp initialRecords={INITIAL_RECORDS} />
  </React.StrictMode>
);
