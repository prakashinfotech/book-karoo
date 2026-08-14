// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — changes rarely, long cache TTL
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-core'
          }

          // TanStack Query — changes rarely
          if (id.includes('@tanstack')) {
            return 'query'
          }

          // Supabase Realtime — only realtime-js, not the full supabase-js bundle
          if (id.includes('@supabase/realtime-js')) {
            return 'supabase'
          }

          // Form handling
          if (id.includes('react-hook-form') ||
              id.includes('@hookform') ||
              id.includes('zod')) {
            return 'forms'
          }

          // Framer Motion — heavy, only used on specific pages
          if (id.includes('framer-motion')) {
            return 'animation'
          }

          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'icons'
          }

          // Axios + other HTTP
          if (id.includes('axios') || id.includes('proxy-')) {
            return 'http'
          }
        }
      }
    },
    // Warn on any chunk over 400KB
    chunkSizeWarningLimit: 400,
  },
  server: { port: 5173 }
})