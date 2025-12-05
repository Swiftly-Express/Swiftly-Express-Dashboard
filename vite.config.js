import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
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
