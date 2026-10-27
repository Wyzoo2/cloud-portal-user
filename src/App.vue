<template>
  <!-- Element Plus 改按需引入后，全局中文语言包改由 ConfigProvider 提供
       （原来是在 main.js 里 app.use(ElementPlus, { locale }) 设的） -->
  <el-config-provider :locale="locale">
    <router-view v-slot="{ Component, route }">
      <!-- 不用 mode="out-in"：异步组件加载中 Component 为 undefined，会整页空白 -->
      <transition name="page">
        <component v-if="Component" :is="Component" :key="route.path" />
      </transition>
      <!-- 异步组件加载占位 -->
      <div v-if="!Component" class="route-loading" aria-busy="true" aria-label="页面加载中">
        <span class="dot"></span>
      </div>
    </router-view>
  </el-config-provider>
</template>

<script>
import zhCn from 'element-plus/es/locale/lang/zh-cn'

export default {
  name: 'App',
  data() {
    return { locale: zhCn }
  }
}
</script>
