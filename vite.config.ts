import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import Pages from 'vite-plugin-pages';
import blog from './plugins/blog';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    blog(),
    react(),
    Pages({
      dirs: [{ dir: 'src/artifacts', baseRoute: '' }],
      extensions: ['jsx', 'tsx'],
      exclude: ['**/components/**/*'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
