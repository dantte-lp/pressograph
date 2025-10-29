import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'dev-pressograph.infra4.dev',
      'localhost',
      '127.0.0.1',
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: 'dev-pressograph.infra4.dev',
    },
    watch: {
      usePolling: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
