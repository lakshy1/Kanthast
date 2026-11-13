import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev only: send the bare root (and any path outside /school/) to the app,
// instead of Vite's "public base URL" notice.
const redirectToBase = {
  name: 'redirect-to-base',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '/';
      if (url === '/' || url === '/index.html' || url === '/school') {
        res.statusCode = 302;
        res.setHeader('Location', '/school/');
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
