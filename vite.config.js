import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 后端地址：默认就是真后端（不设环境变量时行为与原来完全一致）。
// 要用本地 mock 时，先设环境变量再起服务（PowerShell）：
//   $env:API_TARGET="http://localhost:3001"; npm run dev
// 切回真后端：关掉重开一个终端，直接 npm run dev 即可。
const API_TARGET = process.env.API_TARGET || 'http://192.168.9.100:3000'

// 启动时把实际生效的后端地址打出来，方便确认代理到底打到哪
console.log(`[vite] /api  →  ${API_TARGET}`)

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
