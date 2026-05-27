import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Forces Vite to pre-bundle Recharts and resolve internal CommonJS helper functions cleanly
    include: ['recharts'],
  },
  build: {
    commonjsOptions: {
      // Directs the bundler to transform internal dependencies seamlessly
      include: [/recharts/, /node_modules/],
    },
    rollupOptions: {
      output: {
        // Generates completely unique filenames using a live timestamp to smash Render and Chrome's edge cache
        entryFileNames: `assets/[name]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-${Date.now()}.[ext]`,
      },
    },
  },
});