<template>
  <div class="paged-table" v-loading="loading">
    <!-- PC：表格 -->
    <el-table v-if="!isMobile && rows.length" :data="rows" :row-key="rowKey"
      class="pc-table" @row-click="onRowClick">
      <el-table-column v-for="col in columns" :key="col.key" :prop="col.key"
        :label="col.label" :width="col.width" :min-width="col.minWidth"
        :align="col.align || 'left'" show-overflow-tooltip>
        <template #default="scope">
          <slot :name="cellSlot(col.key)" :row="scope.row" :value="scope.row[col.key]" :column="col">
            {{ cellText(scope.row, col) }}
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 移动端：卡片列表 -->
    <div v-else-if="isMobile && rows.length" class="mobile-list">
      <div v-for="row in rows" :key="row[rowKey]" class="mobile-card" @click="onRowClick(row)">
        <slot name="mobile" :row="row">
          <div v-for="col in columns" :key="col.key" class="m-row">
            <span class="m-label">{{ col.label }}</span>
            <span class="m-value">
              <slot :name="cellSlot(col.key)" :row="row" :value="row[col.key]" :column="col">
                {{ cellText(row, col) }}
              </slot>
            </span>
          </div>
        </slot>
      </div>
    </div>

    <!-- 空态（需要引导按钮时用 #empty 插槽，如「去充值」「去逛商品」） -->
    <template v-else-if="!loading">
      <slot name="empty">
        <EmptyState :description="emptyText" />
      </slot>
    </template>

    <!-- 分页（方案 C · 极紧凑）：区间 + 条数 + ‹ 当前页/总页 ›，见 components/Pager.vue -->
    <div v-if="total > 0" class="pager-wrap">
      <Pager
        :total="total"
        :page="page"
        :size="safeSize"
        :page-sizes="safePageSizes"
        @page-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>
  </div>
</template>

<script>
import { useIsMobile } from '../utils/breakpoint'
import EmptyState from './EmptyState.vue'
import Pager from './Pager.vue'

export default {
  name: 'PagedTable',
  components: { EmptyState, Pager },
  props: {
    // [{ key, label, width?, minWidth?, align?, formatter?(row, value, col) }]
    columns: { type: Array, required: true },
    rows: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    total: { type: Number, default: 0 },
    page: { type: Number, default: 1 },
    size: { type: Number, default: 20 },
    pageSizes: { type: Array, default: () => [10, 20, 50] },
    rowKey: { type: String, default: 'id' },
    emptyText: { type: String, default: '暂无数据' }
  },
  emits: ['page-change', 'size-change', 'row-click'],
  setup() {
    const isMobile = useIsMobile()
    return { isMobile }
  },
  computed: {
    // 后端 size 上限 100：外部传超限值时这里兜住
    safePageSizes() {
      const list = this.pageSizes.filter(n => Number(n) <= 100)
      return list.length ? list : [20]
    },
    // 当前页大小也夹到 1~100
    safeSize() {
      const n = Number(this.size) || 20
      return Math.min(Math.max(1, n), 100)
    }
  },
  methods: {
    cellSlot(key) { return 'cell-' + key },
    cellText(row, col) {
      if (col.formatter) return col.formatter(row, row[col.key], col)
      const v = row[col.key]
      return v == null || v === '' ? '-' : v
    },
    onPageChange(p) { this.$emit('page-change', p) },
    onSizeChange(s) { this.$emit('size-change', s) },
    onRowClick(row) { this.$emit('row-click', row) }
  }
}
</script>

<style scoped>
.pc-table {
  width: 100%;
}
.mobile-list {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}
.mobile-card {
  padding: var(--s-3);
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  cursor: pointer;
}
.m-row {
  display: flex;
  justify-content: space-between;
  padding: var(--s-1) 0;
  font-size: var(--font-sm);
}
.m-label {
  color: var(--ink-3);
  flex-shrink: 0;
}
.m-value {
  color: var(--ink);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 分页区：间距交给 Pager 自己的内边距（14px 上下），这里不再叠加外边距，
   否则表格底线到分页文字会出现 30px 的空白，看着像没对齐 */
.pager-wrap {
  margin-top: 0;
}
</style>
