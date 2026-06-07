import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/9999/',
  cacheDir: false,
  build: {
    outDir: 'dist',
    rollupOptions: {
      cache: false,
      output: {
        manualChunks: undefined,
      },
    },
  },
});
