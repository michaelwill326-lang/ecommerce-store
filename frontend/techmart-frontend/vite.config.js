import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
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
