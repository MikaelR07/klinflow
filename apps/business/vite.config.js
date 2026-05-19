import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  envDir: resolve(__dirname, '../../'),
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Klinflow Business', // Normalized name
        short_name: 'CF Business',
        description: 'Klinflow Business PWA for companies and recyclers',
        theme_color: '#00A651',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5175
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['framer-motion', 'lucide-react'],
          data: ['recharts', 'zod', 'zustand']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@klinflow/core': resolve(__dirname, '../../packages/core/src'),
      '@klinflow/ui': resolve(__dirname, '../../packages/ui/src'),
      '@klinflow/constants': resolve(__dirname, '../../packages/constants/src'),
      '@klinflow/supabase': resolve(__dirname, '../../packages/supabase/src'),
      '@klinflow/types': resolve(__dirname, '../../packages/types/src')
    }
  }
});
