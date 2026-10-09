<template>
  <div class="placeholder">
    <EmptyState :description="description" />
  </div>
</template>

<script>
import EmptyState from '../components/EmptyState.vue'

// 占位页：路由骨架已就绪，页面实现由对应板块负责
export default {
  name: 'PlaceholderView',
  components: { EmptyState },
  computed: {
    description() {
      const t = this.$route.meta.title
      return t ? `「${t}」页面待实现` : '页面待实现'
    }
  }
}
</script>

<style scoped>
.placeholder {
  padding: var(--space-xl) 0;
}
</style>
