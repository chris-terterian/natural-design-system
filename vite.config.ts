import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'natural-design-system' },
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] },
    emptyOutDir: false,
  },
});
