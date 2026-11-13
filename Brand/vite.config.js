import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
