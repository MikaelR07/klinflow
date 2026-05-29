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
      includeAssets: ['logo.png', 'icons/*.png', 'agent-logo.webp', 'vectors/*.webp'],
      manifest: {
        name: 'Klinflow Agent',
        short_name: 'Klinflow Agent',
        description: 'Klinflow Agent PWA for waste collectors',
        theme_color: '#00A651',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/agent-logo.webp',
            sizes: '192x192 512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5174
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['framer-motion', 'lucide-react', 'react-virtuoso'],
          maps: ['leaflet', 'react-leaflet'],
          data: ['recharts', 'zod', 'zustand']
        }
      }
    }
  }
});
