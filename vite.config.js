import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 后端地址：默认内网测试环境 .105（此前是 .103，两者都是同一套 portal 服务，按现场实际为准）。
// 连别的后端用环境变量覆盖即可：$env:API_TARGET="http://192.168.9.103:3000"; npm run dev
const API_TARGET = process.env.API_TARGET || 'http://192.168.9.105:3000'

// 启动时把实际生效的后端地址打出来，方便确认代理到底打到哪
console.log(`[vite] /api  →  ${API_TARGET}`)

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    watch: {
      // 编辑器/工具在源码目录里写临时文件时，watcher 抓到这些半成品会 EBUSY 直接崩掉 dev server，忽略掉
      ignored: ['**/.*.tmp*', '**/*.tmp', '**/*.tmpdir/**', '**/.~*', '**/*.swp']
    },
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
