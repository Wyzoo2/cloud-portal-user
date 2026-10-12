<template>
  <div class="transactions">
    <div class="page-head" v-reveal>
      <h2>消费流水</h2>
      <el-radio-group v-model="type" @change="onFilter">
        <el-radio-button v-for="t in tabs" :key="t.label" :value="t.value">{{ t.label }}</el-radio-button>
      </el-radio-group>
    </div>

    <PagedTable v-reveal="{ delay: 100 }" :columns="columns" :rows="rows" :loading="loading" :total="total"
      :page="page" :size="size" row-key="id"
      @page-change="onPage" @size-change="onSize">
      <template #cell-type="{ row }">
        <StatusTag type="transaction" :value="row.type" />
      </template>
      <template #cell-amount_cents="{ row }">
        <span :class="amtClass(row)">
          <AmountText :cents="Math.abs(row.amount_cents)" :sign="signOf(row)" />
        </span>
      </template>
      <template #cell-balance_after="{ row }">
        <AmountText :cents="row.balance_after" />
      </template>
      <template #cell-product_code="{ row }">
        {{ productLineName(row.product_code) }}
      </template>
      <template #cell-detail="{ row }">
        {{ detailText(row.detail) }}
      </template>

      <!-- 移动端三段式：类型+时间 / 金额 / 商品+余额 -->
      <template #mobile="{ row }">
        <div class="m-top">
          <StatusTag type="transaction" :value="row.type" />
          <span class="m-time">{{ formatTime(row.created_at) }}</span>
        </div>
        <div class="m-amt" :class="amtClass(row)">
          <AmountText :cents="Math.abs(row.amount_cents)" :sign="signOf(row)" />
        </div>
        <div class="m-sub">
          {{ productLineName(row.product_code) }} · 余额 <AmountText :cents="row.balance_after" />
        </div>
      </template>

      <template #empty>
        <EmptyState :description="error ? '流水加载失败，请稍后重试' : '暂无流水'">
          <el-button v-if="error" type="primary" @click="load">重新加载</el-button>
        </EmptyState>
      </template>
    </PagedTable>
  </div>
</template>

<script>
import { api } from '../api'
import { formatTime } from '../utils/format'
import { TRANSACTION_TYPE, TRANSACTION_TYPE_TABS, productLineName } from '../utils/constants'
import { AmountText, PagedTable, EmptyState, StatusTag } from '../components'

/** detail 是产品传的任意 JSON：嵌套值降级成 JSON 字符串，绝不渲染出 [object Object] */
function flatValue(v) {
  if (v == null) return '-'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export default {
  name: 'TransactionsView',
  components: { AmountText, PagedTable, EmptyState, StatusTag },
  data() {
    return {
      type: '',
      rows: [],
      total: 0,
      page: 1,
      size: 20,
      loading: false,
      error: false,
      tabs: TRANSACTION_TYPE_TABS,
      columns: [
        { key: 'type', label: '类型', width: 90 },
        { key: 'amount_cents', label: '金额' },
        { key: 'balance_after', label: '变动后余额' },
        { key: 'product_code', label: '商品' },
        { key: 'detail', label: '明细' },
        { key: 'created_at', label: '时间', formatter: row => formatTime(row.created_at) },
        { key: 'bill_no', label: '流水号' }
      ]
    }
  },
  created() {
    this.load()
  },
  methods: {
    formatTime,
    productLineName,
    async load() {
      this.loading = true
      this.error = false
      try {
        // 「全部」时不传 type，避免后端把空值当成某个具体类型
        const params = { page: this.page, size: this.size }
        if (this.type !== '') params.type = this.type
        const data = await api.getTransactions(params)
        this.rows = (data && data.list) || []
        this.total = (data && data.total) || 0
      } catch (e) {
        // 失败统一走空态里的「重新加载」，不再额外 toast，避免同一错误两处反馈
        this.error = true
        this.rows = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },
    // 1 充值 / 2 扣费 / 3 退款 的方向由 type 决定；4 调账由金额正负决定
    // 后端字段理论上都是数字，这里统一 Number 归一，避免字符串导致方向判断失效
    signOf(row) {
      if (Number(row.type) === 4) return Number(row.amount_cents) < 0 ? '-' : '+'
      return (TRANSACTION_TYPE[row.type] && TRANSACTION_TYPE[row.type].sign) || ''
    },
    amtClass(row) {
      const t = Number(row.type)
      if (t === 4) return Number(row.amount_cents) < 0 ? 'amt-out' : 'amt-in'
      return { 1: 'amt-in', 2: 'amt-out', 3: 'amt-in' }[t] || ''
    },
    detailText(detail) {
      if (detail == null) return '-'
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) return detail.map(flatValue).join(', ')
      if (typeof detail === 'object') {
        return Object.entries(detail).map(([k, v]) => `${k}: ${flatValue(v)}`).join(' · ')
      }
      return String(detail)
    },
    onFilter() {
      this.page = 1
      this.load()
    },
    onPage(p) {
      this.page = p
      this.load()
    },
    onSize(s) {
      this.size = s
      this.page = 1
      this.load()
    }
  }
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
}
.page-head h2 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--ink);
}
/* 类型标签由公共组件 StatusTag 渲染，这里不再重复实现一套 pill 样式 */
.amt-in {
  color: var(--success);
  font-weight: 600;
}
.amt-out {
  color: var(--danger);
  font-weight: 600;
}

/* 移动端三段式卡片内部（PagedTable 的 #mobile 插槽） */
.m-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  margin-bottom: var(--s-1);
}
.m-time {
  font-size: var(--font-xs);
  color: var(--ink-3);
  white-space: nowrap;
}
.m-amt {
  font-size: var(--font-lg);
  font-weight: 700;
  margin-bottom: var(--s-1);
}
.m-sub {
  font-size: var(--font-sm);
  color: var(--ink-3);
}

@media (max-width: 1000px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
/* 筛选按钮在移动端要够大（触控目标 ≥44px） */
@media (max-width: 768px) {
  .transactions :deep(.el-radio-button__inner) {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 0 14px;
  }
}
</style>
