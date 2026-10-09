<template>
  <el-tag :type="meta.type" :effect="effect" :size="size" disable-transitions>
    {{ meta.text }}
  </el-tag>
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
    value: { type: [Number, String], required: true },
    effect: { type: String, default: 'light' },
    size: { type: String, default: 'small' }
  },
  setup(props) {
    const meta = computed(() => {
      const map = MAPS[props.type] || {}
      return map[props.value] || { text: String(props.value), type: 'info' }
    })
    return { meta }
  }
}
</script>
