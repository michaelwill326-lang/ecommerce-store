import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const timestamp = Date.now();

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['recharts'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    commonjsOptions: {
      include: [/recharts/, /node_modules/],
    },
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-${timestamp}.js`,
        chunkFileNames: `assets/[name]-${timestamp}.js`,
        assetFileNames: `assets/[name]-${timestamp}.[ext]`,
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'recharts': ['recharts'],
          'axios': ['axios'],
          'socket': ['socket.io-client'],
        },
      },
    },
  },
});
