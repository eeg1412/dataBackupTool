import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const adminPath = env.VITE_ADMIN_PATH || 'admin'

  return {
    plugins: [vue(), tailwindcss()],
    base: './',
    build: {
      outDir: '../back/front',
      emptyOutDir: true
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: path => `/${adminPath}${path}`
        }
      }
    }
  }
})
