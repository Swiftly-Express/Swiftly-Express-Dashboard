import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // match Ionic's default dev origin (localhost:8100) so requests originate
    // from the same origin while developing. Adjust if you run a different port.
    port: 8100,
    open: true,
    // Dev proxy to avoid CORS when calling an API during local development.
    // Requests starting with /api will be forwarded to the configured API host.
    // Set environment variable VITE_API_PROXY to override (e.g. http://localhost:3000)
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'https://api.swiftlyxpress.com',
        changeOrigin: true,
        secure: false,
        // Increase timeouts to tolerate slower backends in dev; allow websockets
        proxyTimeout: 30000,
        timeout: 30000,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Override origin to bypass CORS
            try {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
              proxyReq.setHeader('origin', 'https://swiftlyxpress.com');
              proxyReq.setHeader('referer', 'https://swiftlyxpress.com/');
            } catch (e) { }
          });
          proxy.on('error', (err, req, res) => {
            try {
              console.warn('[vite proxy] error proxying', req && req.url, err && err.message);
              if (res && !res.headersSent) {
                res.writeHead && res.writeHead(504, { 'Content-Type': 'application/json' });
                res.end && res.end(JSON.stringify({ error: 'Upstream service unreachable', details: err && err.message }));
              }
            } catch (e) { console.warn('[vite proxy] error handler failed', e); }
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor_react';
            if (id.includes('@ionic') || id.includes('ionicons')) return 'vendor_ionic';
            if (id.includes('mapbox-gl') || id.includes('react-map-gl') || id.includes('@mapbox')) return 'vendor_mapbox';
            if (id.includes('lucide-react')) return 'vendor_icons';
            return 'vendor_misc';
          }
        }
      }
    }
  }
})
