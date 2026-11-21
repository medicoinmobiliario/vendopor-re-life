import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const vendor = fileURLToPath(new URL('./src/vendor', import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  assetsInclude: ['**/*.zip'],
  resolve: {
    alias: [
      { find: /^three\/addons\//, replacement: vendor + '/addons/' },
      { find: /^three$/, replacement: vendor + '/three.module.js' },
    ],
  },
  build: { assetsInlineLimit: 100000000, chunkSizeWarningLimit: 4000 },
});
