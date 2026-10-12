/**
 * 入口：注册 pinia / 路由，挂载 App
 *
 * Element Plus 走**按需引入**（见 vite.config.js 的 Components / AutoImport 插件）：
 * 模板里的 <el-xxx> 和代码里的 ElMessage 等用哪个打包哪个，
 * 所以这里不再 app.use(ElementPlus)、也不再引全量 index.css。
 * 全局中文语言包改由 App.vue 的 <el-config-provider> 提供。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { reveal } from './directives/reveal'
import './assets/main.css'

/**
 * 服务式组件（ElMessage / ElMessageBox / v-loading）不是模板标签：
 * unplugin 只会为它们注入 JS，**样式得自己引**，否则 toast 和确认框会没有背景/阴影，
 * 表现为"提示好像没弹出来"。这里按实际用到的三个引入（项目未用 ElNotification）。
 */
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/loading/style/css'

const app = createApp(App)
app.use(createPinia()).use(router)
app.directive('reveal', reveal)
app.mount('#app')
