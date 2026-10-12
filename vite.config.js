import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 后端地址：默认指向内网测试环境。开发文档里写的 192.168.9.100 已过期；
// 此前用过 .103、当前是 .105 —— 都是同一套 portal 服务，按现场实际为准。
// 换地址【不用改代码】，用环境变量覆盖即可：
//   $env:API_TARGET="http://192.168.9.103:3000"; npm run dev
const API_TARGET = process.env.API_TARGET || 'http://192.168.9.105:3000'

// 启动时把实际生效的后端地址打出来，方便确认代理到底打到哪
console.log(`[vite] /api  →  ${API_TARGET}`)

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    watch: {
      // 编辑器/工具在源码目录里写临时文件时，watcher 抓到这些半成品会 EBUSY 直接崩掉 dev server，忽略掉。
      // 实测踩到过：SiteFooter.vue~RFa92383c.TMP（VS/MSBuild 风格的原子保存临时文件，大写 .TMP，前缀 ~RF）
      ignored: [
        '**/.*.tmp*',
        '**/*.tmp',
        '**/*.TMP',
        '**/*.tmpdir/**',
        '**/.~*',
        '**/*~RF*',
        '**/*.swp',
        '**/*.swx',
        '**/*.bak'
      ]
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
