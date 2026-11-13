import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev only: send the bare root (and any path outside /professional/) to the app,
// instead of Vite's "public base URL" notice.
const redirectToBase = {
  name: 'redirect-to-base',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '/';
      if (url === '/' || url === '/index.html' || url === '/professional') {
        res.statusCode = 302;
        res.setHeader('Location', '/professional/');
        return res.end();
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [
    react(),
    redirectToBase,
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
