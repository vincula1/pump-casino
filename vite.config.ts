import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cast process to any to avoid TS errors with cwd() in some environments
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Safe extraction of variables with user provided fallbacks
  const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || 'https://wkblzroluuljlsklxyeb.supabase.co';
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYmx6cm9sdXVsamxza2x4eWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxMzgsImV4cCI6MjA3OTE2MjEzOH0.HpPtkq8gGZGH0-WDMyoFMuTEZwU64j397NJNLBmld1A';
  // Injecting the user provided API key directly here
  const apiKey = env.API_KEY || env.VITE_API_KEY || 'AIzaSyDOsg8tqQ0hAYTtS4wk4a_rhgRrkRYnTdE';

  return {
    plugins: [react()],
    define: {
      // We only define specific keys to avoid overwriting the whole process object in browser
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
    }
  };
});