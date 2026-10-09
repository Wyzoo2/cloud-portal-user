<template>
  <el-skeleton v-if="loading" :rows="rows" animated />
  <slot v-else />
</template>

<script>
export default {
  name: 'LoadingBox',
  props: {
    loading: { type: Boolean, default: false },
    rows: { type: Number, default: 3 }
  }
}
</script>
