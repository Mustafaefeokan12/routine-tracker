import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Ensures assets load properly on GitHub Pages (sub-paths)
  plugins: [
    tailwindcss(),
    react()
  ],
})
