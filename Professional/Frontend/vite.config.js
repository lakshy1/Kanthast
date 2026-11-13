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

// Build only: make stylesheets non-render-blocking so the inline boot loader in
// index.html paints immediately on slow connections. The loader stays up until
// the main CSS has applied (see utils/bootLoader.js), so there is no unstyled flash.
const nonBlockingCss = {
  name: 'non-blocking-css',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      return html.replace(/<link rel="stylesheet"([^>]*?)href="([^"]+)"([^>]*)>/g, (tag, a, href, b) =>
        `<link rel="stylesheet"${a}href="${href}"${b} media="print" onload="this.media='all'"><noscript>${tag}</noscript>`);
    },
  },
};

export default defineConfig({
  plugins: [
    react(),
    nonBlockingCss,
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
