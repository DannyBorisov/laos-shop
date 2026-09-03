import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Vite 8 blocks unknown hosts by default; loosen for LAN/Docker dev.
    allowedHosts: true,
    proxy: {
      '/api': {
        // Override with VITE_PROXY_TARGET (e.g. http://backend:3010) when running in Docker.
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3010',
        changeOrigin: true,
      },
    },
  },
})
