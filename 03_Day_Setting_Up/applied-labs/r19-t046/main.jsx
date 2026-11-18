import React from 'react';
import ReactDOM from 'react-dom/client';
import ProductCardApp, { DEFAULT_PRODUCT } from './example.jsx';

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ProductCardApp initialProduct={DEFAULT_PRODUCT} />
  </React.StrictMode>
);
