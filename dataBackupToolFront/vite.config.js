import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../back/front'),
    emptyOutDir: true
  },
  server: {
    proxy: {
      // 代理 API 请求到后台服务
      // 格式: /abc/api/* -> http://localhost:3000/abc/api/*
      '^/abc/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
        // 不改写路径，保持原样
      }
    }
  }
})
