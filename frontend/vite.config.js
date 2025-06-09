// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006,
    host: true,
    open: true,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Fix case sensitivity issues
    preserveSymlinks: false,
  },
  // Fix case sensitivity on Windows
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  // Make sure Vite treats .js files as JSX
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  }
})