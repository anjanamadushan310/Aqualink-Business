import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure environment variables are available in the build
  define: {
    'process.env': process.env,
    'global': 'globalThis'
  }
})
