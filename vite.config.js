import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
    proxy: { '/api': 'http://localhost:8000' },
  },
})
