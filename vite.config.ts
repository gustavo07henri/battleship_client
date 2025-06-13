import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window', // Fornece 'global' como alias para 'window'
  },
  server: {
    allowedHosts: [
      'f20e-2804-d45-d905-2f00-5dab-81fe-3285-8fc.ngrok-free.app'
    ]
  }
});
