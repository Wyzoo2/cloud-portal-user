import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { MOUNTED, API_BASE } from './src/deploy.config.js'

// 后端地址：默认指向内网测试环境。开发文档里写的 192.168.9.100 已过期；
// 此前用过 .103、当前是 .105 —— 都是同一套 portal 服务，按现场实际为准。
// 换地址【不用改代码】，用环境变量覆盖即可：
//   $env:API_TARGET="http://192.168.9.103:3000"; npm run dev
const API_TARGET = process.env.API_TARGET || 'http://192.168.9.105:3000'

// 启动时把实际生效的接口前缀 / 后端地址打出来，方便确认代理到底打到哪
console.log(`[vite] ${API_BASE}  →  ${API_TARGET}（MOUNTED=${MOUNTED}）`)

export default defineConfig({
  plugins: [
    vue(),
    // Element Plus 按需引入：模板里的 <el-xxx> 用哪个就只打包哪个（含它的样式）
    Components({ resolvers: [ElementPlusResolver()] }),
    // 服务式组件（ElMessage / ElMessageBox / ElNotification / ElLoading）由它按需注入
    AutoImport({ resolvers: [ElementPlusResolver()] })
  ],
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
      },
      // 生产接口前缀 /portal/api；转发时剥掉 /portal（后端若配了 context-path=/portal 则删掉 rewrite）
      '/portal/api': {
        target: API_TARGET,
        changeOrigin: true,
        // rewrite: p => p.replace(/^\/portal/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // 只把「框架层」拆出来（vue / vue-router / pinia）——它们版本稳定、几乎永不变，
        // 独立成 chunk 后能长期命中浏览器缓存。
        // Element Plus 故意**不**在这里强制合并：各页面是按需 import 的，
        // 交给 rollup 自动分包，首页就不会被迫下载 table/dialog 这些只在别的页面用到的重组件。
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/vue/') || id.includes('vue-router') || id.includes('/pinia/') || id.includes('@vue/')) {
            return 'vendor-vue'
          }
        }
      }
    }
  }
})
