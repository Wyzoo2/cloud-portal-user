/**
 * 入口：注册 pinia / 路由 / Element Plus，挂载 App
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { router } from './router'
import { reveal } from './directives/reveal'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
  .use(router)
  .use(ElementPlus, { locale: zhCn })
app.directive('reveal', reveal)
app.mount('#app')
