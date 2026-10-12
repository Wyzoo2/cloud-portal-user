<template>
  <div class="kpis" :class="{ 'kpi-3': items.length === 3 }">
    <div v-for="it in items" :key="it.label" class="kpi">
      <span>{{ it.label }}</span>
      <b class="figure">
        {{ it.value }}<i v-if="it.unit">{{ it.unit }}</i>
      </b>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KpiRow',
  props: {
    // [{ label, value, unit? }]，值一律由调用方给真实数据，组件不造数
    items: { type: Array, default: () => [] }
  }
}
</script>

<style scoped>
/* A 方案指标网格：1px 发丝线分格，不投影 */
.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.kpis.kpi-3 {
  grid-template-columns: repeat(3, 1fr);
}
.kpi {
  background: var(--bg-0);
  padding: 22px var(--s-6);
}
.kpi span {
  font-size: 12px;
  color: var(--ink-3);
}
.kpi b {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.kpi b i {
  font-size: 13px;
  font-style: normal;
  font-weight: 500;
  color: var(--ink-3);
  margin-left: 4px;
  letter-spacing: 0;
}

@media (max-width: 1000px) {
  .kpis,
  .kpis.kpi-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .kpi {
    padding: 16px var(--s-4);
  }
  .kpi b {
    font-size: 22px;
  }
}
</style>
