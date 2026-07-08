import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Allow sharing the local dev server through ngrok tunnels for demos.
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.dev', '.ngrok.io'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
