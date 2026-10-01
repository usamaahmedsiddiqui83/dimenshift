import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    // three.js is ~860 kB minified but is only reachable through the lazy MechanismCanvas import,
    // so it never blocks first paint. (A manualChunks split was removed: it caused index.html to
    // modulepreload the three.js chunk eagerly.)
    chunkSizeWarningLimit: 950,
  },
});
