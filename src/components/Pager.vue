<template>
  <!-- 分页（方案 C · 极紧凑）
       左：区间「1–3 / 共 137 条」  中：条数选择  右：‹ 3 / 7 ›
       为什么不用 el-pagination：它给不出「区间 + 当前页/总页 + 方形箭头」这个结构，
       手写才能保证和设计稿一模一样。 -->
  <div class="pager">
    <!-- 区间 + 总数 -->
    <span class="range">
      <b>{{ rangeStart }}–{{ rangeEnd }}</b> / 共 {{ total }} 条
    </span>

    <!-- 每页条数（移动端窄，隐藏） -->
    <span v-if="!isMobile && sizes.length > 1" class="size">
      <el-select
        :model-value="size"
        size="small"
        :teleported="true"
        class="size-select"
        @update:model-value="onSizeChange"
      >
        <el-option v-for="n in sizes" :key="n" :label="`${n} 条/页`" :value="n" />
      </el-select>
    </span>

    <!-- 上一页 / 当前页 / 下一页 -->
    <span class="nav">
      <button
        type="button"
        class="sq"
        :class="{ dis: page <= 1 }"
        :disabled="page <= 1"
        aria-label="上一页"
        @click="go(page - 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6" /></svg>
      </button>
      <span class="page-text">{{ page }} / {{ pageCount }}</span>
      <button
        type="button"
        class="sq"
        :class="{ dis: page >= pageCount }"
        :disabled="page >= pageCount"
        aria-label="下一页"
        @click="go(page + 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6" /></svg>
      </button>
    </span>
  </div>
</template>

<script>
import { useIsMobile } from '../utils/breakpoint'

export default {
  name: 'Pager',
  props: {
    total: { type: Number, default: 0 },
    page: { type: Number, default: 1 },
    size: { type: Number, default: 20 },
    pageSizes: { type: Array, default: () => [10, 20, 50] }
  },
  emits: ['page-change', 'size-change'],
  setup() {
    const isMobile = useIsMobile()
    return { isMobile }
  },
  computed: {
    // 后端 size 上限 100：超限的选项直接不展示
    sizes() {
      const list = this.pageSizes.map(Number).filter(n => n > 0 && n <= 100)
      return list.length ? list : [20]
    },
    safeSize() {
      const n = Number(this.size) || 20
      return Math.min(Math.max(1, n), 100)
    },
    pageCount() {
      return Math.max(1, Math.ceil(this.total / this.safeSize))
    },
    rangeStart() {
      return this.total ? (this.page - 1) * this.safeSize + 1 : 0
    },
    rangeEnd() {
      return Math.min(this.page * this.safeSize, this.total)
    }
  },
  methods: {
    go(p) {
      if (p < 1 || p > this.pageCount || p === this.page) return
      this.$emit('page-change', p)
    },
    onSizeChange(n) {
      const val = Number(n)
      if (!val || val === this.safeSize) return
      this.$emit('size-change', val)
    }
  }
}
</script>

<style scoped>
/* 与设计稿一致：右对齐，三段之间 18px；
   左右各留 24px —— 和表格单元格的内边距对齐，否则分页会贴到卡片边线上 */
.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  padding: 14px 24px;
  font-size: 13px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

/* 区间：数字用墨色加粗，其余 12px 次要色 */
.range {
  font-size: 12px;
  color: var(--ink-3);
}
.range b {
  color: var(--ink);
  font-weight: 600;
}

/* 条数选择：无边框纯文字 + 细箭头。
   注意 el-select 默认 width:100%，在 inline-flex 里会把宽度算成 0（只剩箭头），
   所以这里显式给 auto + min-width，保证「20 条/页」文字不被裁掉 */
.size {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--ink-2);
}
.size-select {
  width: auto;
  min-width: 86px;
}
.size-select :deep(.el-select__wrapper) {
  width: auto;
  min-width: 86px;
  min-height: 26px;
  height: 26px;
  padding: 0 4px 0 2px;
  background: transparent;
  box-shadow: none !important;
  font-size: 12px;
  color: var(--ink-2);
}
.size-select :deep(.el-select__wrapper:hover) {
  color: var(--brand);
}
.size-select :deep(.el-select__selected-item),
.size-select :deep(.el-select__placeholder) {
  font-size: 12px;
  white-space: nowrap;
  overflow: visible;
}
.size-select :deep(.el-select__suffix) {
  color: var(--ink-3);
  margin-left: 2px;
}
.size-select :deep(.el-select__caret) {
  width: 12px;
  height: 12px;
}

/* 上下页 + 当前页/总页 */
.nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sq {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--line-2);
  border-radius: var(--r-sm);
  background: var(--bg-0);
  color: var(--ink-2);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.sq svg {
  width: 14px;
  height: 14px;
}
.sq:hover:not(.dis) {
  border-color: var(--brand);
  color: var(--brand);
}
.sq:active:not(.dis) {
  background: var(--brand-weak);
}
.sq.dis {
  border-color: var(--line);
  color: var(--ink-4);
  cursor: not-allowed;
}
.page-text {
  font-size: 12px;
  color: var(--ink-3);
  padding: 0 4px;
  white-space: nowrap;
}

/* 移动端：更紧凑，触控目标仍 ≥44px；左右内边距收窄到 16px */
@media (max-width: 768px) {
  .pager {
    justify-content: center;
    gap: 12px;
    padding: 12px 16px;
  }
  .sq {
    width: 44px;
    height: 44px;
  }
}
</style>
