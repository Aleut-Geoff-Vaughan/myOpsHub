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
})
