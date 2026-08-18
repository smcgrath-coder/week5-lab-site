import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // @react-pdf/renderer is dynamically imported only on the Finish screen
    // (see Finish.jsx), so its chunk is large but never blocks initial load.
    chunkSizeWarningLimit: 1500,
  },
})
