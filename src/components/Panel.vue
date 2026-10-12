<template>
  <section class="panel">
    <!-- 面板头：标题 + 说明 + 右侧动作槽 -->
    <header v-if="title || $slots.actions" class="panel-head">
      <div class="ph-left">
        <h2>{{ title }}</h2>
        <small v-if="small">{{ small }}</small>
      </div>
      <div v-if="$slots.actions" class="ph-actions">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>

<script>
export default {
  name: 'Panel',
  props: {
    title: { type: String, default: '' },
    small: { type: String, default: '' }
  }
}
</script>

<style scoped>
/* 内页唯一允许的"卡片"形态：白底 + 发丝线，不投影 */
.panel {
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.panel + .panel {
  margin-top: var(--s-5);
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: 18px var(--s-6);
  border-bottom: 1px solid var(--line);
}
.ph-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.panel-head h2 {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  white-space: nowrap;
}
.panel-head small {
  font-size: 12px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ph-actions {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .panel {
    border-radius: var(--r-md);
  }
  .panel-head {
    padding: 14px var(--s-4);
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .ph-actions {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
