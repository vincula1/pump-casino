import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Safely define process.env to prevent "process is not defined" crashes
    'process.env': {},
    // If specific keys are needed, we can define them here, but the empty object prevents the crash
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
  }
});