<template>
  <span class="status-tag" :class="'st-' + (meta.type || 'neutral')">{{ meta.text }}</span>
</template>

<script>
import { computed } from 'vue'
import { ORDER_STATUS, ORDER_ITEM_STATUS, RECHARGE_STATUS } from '../utils/constants'

const MAPS = { order: ORDER_STATUS, orderItem: ORDER_ITEM_STATUS, recharge: RECHARGE_STATUS }

export default {
  name: 'StatusTag',
  props: {
    // order | orderItem | recharge
    type: { type: String, required: true },
    value: { type: [Number, String], required: true }
  },
  setup(props) {
    const meta = computed(() => {
      const map = MAPS[props.type] || {}
      return map[props.value] || { text: String(props.value), type: 'neutral' }
    })
    return { meta }
  }
}
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 11px;
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  white-space: nowrap;
}
.st-success { color: var(--success); background: var(--success-bg); }
.st-warning { color: var(--warning); background: var(--warning-bg); }
.st-danger { color: var(--danger); background: var(--danger-bg); }
.st-primary { color: var(--brand); background: var(--brand-weak); }
.st-info,
.st-neutral { color: var(--ink-3); background: var(--bg-2); }
</style>
