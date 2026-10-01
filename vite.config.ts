import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // The extraction server holds the Anthropic API key; the browser never sees it
      '/api': `http://127.0.0.1:${process.env.API_PORT ?? 8787}`,
    },
  },
});
