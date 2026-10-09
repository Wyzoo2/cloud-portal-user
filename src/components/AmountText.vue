<template>
  <span class="amount" :class="classes">
    <span v-if="sign" class="sign">{{ sign }}</span>{{ text }}
  </span>
</template>

<script>
import { computed } from 'vue'
import { formatCents } from '../utils/format'

export default {
  name: 'AmountText',
  props: {
    // 金额，单位分
    cents: { type: [Number, String], default: null },
    // 符号前缀：+ / -
    sign: { type: String, default: '' },
    // lg | sm
    size: { type: String, default: '' },
    strong: { type: Boolean, default: false }
  },
  setup(props) {
    const text = computed(() =>
      formatCents(props.cents == null || props.cents === '' ? null : Number(props.cents))
    )
    const classes = computed(() => ({
      strong: props.strong,
      lg: props.size === 'lg',
      sm: props.size === 'sm'
    }))
    return { text, classes }
  }
}
</script>

<style scoped>
.amount {
  font-variant-numeric: tabular-nums;
}
.sign {
  margin-right: 1px;
}
.strong {
  font-weight: 600;
  color: var(--accent);
}
.lg {
  font-size: 22px;
}
.sm {
  font-size: var(--font-sm);
}
</style>
