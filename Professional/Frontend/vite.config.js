import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  base: '/professional/',
  // Dev: this app runs on :5173 under /professional/. Its API calls go to
  // /professional/api/... (same paths as production) and are forwarded to the local
  // Professional backend on :4010 with the /professional prefix removed.
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/professional/api': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:4010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/professional/, ''),
      },
    },
  },
  build: {
    outDir: 'dist/professional',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
