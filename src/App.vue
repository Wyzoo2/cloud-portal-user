<template>
  <!-- Element Plus 改按需引入后，全局中文语言包改由 ConfigProvider 提供
       （原来是在 main.js 里 app.use(ElementPlus, { locale }) 设的） -->
  <el-config-provider :locale="locale">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
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
