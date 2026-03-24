import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },

  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/logout_user': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/signin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/signup': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin_home': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/adminpage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin_signin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin_logout': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/category': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
