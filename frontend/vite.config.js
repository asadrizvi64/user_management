import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    include: '**/*.{jsx,js}',
  })],
  
  server: {
    port: 3001,
    host: true,
    open: false,
    strictPort: false,
    cors: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Fix MUI icons and date-fns optimization issues
  optimizeDeps: {
    exclude: [
      '@mui/x-date-pickers',
      '@mui/x-date-pickers/AdapterDateFns',
      'date-fns'
    ],
    include: [
      '@mui/material',
      '@mui/icons-material',
      'react',
      'react-dom',
      'react-router-dom',
      'prop-types',
      'hoist-non-react-statics',
      'react-is'
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
  
  envPrefix: 'VITE_',
})