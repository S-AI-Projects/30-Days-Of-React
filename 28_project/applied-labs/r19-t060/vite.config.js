import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/course/',
  plugins: [react()],
  server: {
    port: 51739,
    host: 'localhost'
  }
});
