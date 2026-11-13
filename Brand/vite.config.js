import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  base: '/',
  // Dev: open http://localhost:5170. /professional and /school (pages and APIs)
  // are forwarded to the two app dev servers, like Vercel does on kanthast.in.
  server: {
    port: 5170,
    strictPort: true,
    proxy: {
      '/professional': { target: 'http://localhost:5173', changeOrigin: true, ws: true },
      '/school': { target: 'http://localhost:5174', changeOrigin: true, ws: true },
    },
  },
  build: {
    outDir: 'dist',
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
