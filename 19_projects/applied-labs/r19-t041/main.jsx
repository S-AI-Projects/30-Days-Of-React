import React from 'react';
import { createRoot } from 'react-dom/client';
import CatGallery from './example.jsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <CatGallery />
    </React.StrictMode>
  );
}

