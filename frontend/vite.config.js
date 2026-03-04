import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    outDir: '../static/dist',
    rollupOptions: {
      input: {
        main: './src/main.jsx',
      },
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
  }
})
