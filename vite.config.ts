import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Helper to find a variable in either the loaded env or the system process.env
  const getVar = (key: string) => env[key] || process.env[key] || '';

  // We prioritize NEXT_PUBLIC_ variables because that's what Vercel/Supabase often default to
  const supabaseUrl = getVar('VITE_SUPABASE_URL') || getVar('NEXT_PUBLIC_SUPABASE_URL') || getVar('SUPABASE_URL');
  const supabaseKey = getVar('VITE_SUPABASE_ANON_KEY') || getVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getVar('SUPABASE_ANON_KEY');
  const apiKey = getVar('API_KEY') || getVar('VITE_API_KEY');

  return {
    plugins: [react()],
    define: {
      // Safely inject these specific values as string literals
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
      // Fallback to prevent "process is not defined" errors in some libraries
      'process.env': {},
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
    }
  };
});