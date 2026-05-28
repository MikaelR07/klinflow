import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import viteCompression from 'vite-plugin-compression';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: resolve(__dirname, '../../'),
  resolve: {
    alias: {
      '@klinflow/core': resolve(__dirname, '../../packages/core/src'),
      '@klinflow/ui': resolve(__dirname, '../../packages/ui/src'),
      '@klinflow/constants': resolve(__dirname, '../../packages/constants/src'),
      '@klinflow/supabase': resolve(__dirname, '../../packages/supabase/src'),
      '@klinflow/types': resolve(__dirname, '../../packages/types/src')
    }
  },
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    viteCompression({ algorithm: 'gzip', ext: '.gz' })
  ],
  server: {
    port: 5177
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  }
});
