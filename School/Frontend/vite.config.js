import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  base: '/school/',
  // Dev: this app runs on :5174 under /school/. Its API calls go to
  // /school/api/... (same paths as production) and are forwarded to the local
  // School backend on :4011 with the /school prefix removed.
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/school/api': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:4011',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/school/, ''),
      },
    },
  },
  build: {
    outDir: 'dist/school',
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
