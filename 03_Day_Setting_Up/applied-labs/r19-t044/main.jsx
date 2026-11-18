import React from 'react';
import ReactDOM from 'react-dom/client';
import ProductCardApp, { INITIAL_PRODUCT } from './example.jsx';

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ProductCardApp initialProduct={INITIAL_PRODUCT} />
  </React.StrictMode>
);
