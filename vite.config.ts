import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// In dev, /api is proxied to the API Gateway (override with GATEWAY_URL)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: process.env.GATEWAY_URL ?? 'http://localhost:8080', changeOrigin: true, rewrite: p => p.replace(/^\/api/, '') } } }
})
