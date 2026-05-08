import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: resolve(__dirname, '../../'),
  plugins: [
    react()
  ],
  server: {
    port: 5177
  }
});
