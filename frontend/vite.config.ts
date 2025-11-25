import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Default to backend's launchSettings port (5107). Override with VITE_API_PROXY_TARGET if different.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:5107'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'router';
            if (id.includes('@tanstack/react-query')) return 'react-query';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('react-dom') || id.includes('react/jsx-runtime') || id.includes('react-refresh')) {
              return 'react-vendor';
            }
            if (id.includes('zustand')) return 'zustand';
            if (id.includes('react-hot-toast') || id.includes('lucide-react')) return 'ui-helpers';
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
})
