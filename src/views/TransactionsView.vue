<template>
  <div class="transactions">
    <div class="page-head" v-reveal>
      <h2>消费流水</h2>
      <el-radio-group v-model="type" @change="onFilter">
        <el-radio-button :value="''">全部</el-radio-button>
        <el-radio-button :value="1">充值</el-radio-button>
        <el-radio-button :value="2">扣费</el-radio-button>
        <el-radio-button :value="3">退款</el-radio-button>
        <el-radio-button :value="4">调账</el-radio-button>
      </el-radio-group>
    </div>

    <PagedTable v-reveal="{ delay: 100 }" :columns="columns" :rows="rows" :loading="loading" :total="total"
      :page="page" :size="size" empty-text="暂无流水"
      @page-change="onPage" @size-change="onSize">
      <template #cell-type="{ row }">
        <el-tag :type="typeTag(row.type)" size="small" effect="light">{{ typeText(row.type) }}</el-tag>
      </template>
      <template #cell-amount_cents="{ row }">
        <span :class="amtClass(row.type)">
          <AmountText :cents="Math.abs(row.amount_cents)" :sign="signOf(row.type)" />
        </span>
      </template>
      <template #cell-balance_after="{ row }">
        <AmountText :cents="row.balance_after" />
      </template>
      <template #cell-detail="{ row }">
        {{ detailText(row.detail) }}
      </template>
    </PagedTable>
  </div>
</template>

<script>
import { api } from '../api'
import { formatTime } from '../utils/format'
import { TRANSACTION_TYPE } from '../utils/constants'
import { AmountText, PagedTable } from '../components'

export default {
  name: 'TransactionsView',
  components: { AmountText, PagedTable },
  data() {
    return {
      type: '',
      rows: [],
      total: 0,
      page: 1,
      size: 20,
      loading: false,
      columns: [
        { key: 'type', label: '类型', width: 90 },
        { key: 'amount_cents', label: '金额' },
        { key: 'balance_after', label: '变动后余额' },
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
    async load() {
      this.loading = true
      try {
        const data = await api.getTransactions({ page: this.page, size: this.size, type: this.type })
        this.rows = data.list
        this.total = data.total
      } catch (e) {
        this.rows = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },
    typeText(t) {
      return (TRANSACTION_TYPE[t] && TRANSACTION_TYPE[t].text) || '-'
    },
    typeTag(t) {
      return { 1: 'success', 2: 'danger', 3: 'success', 4: 'info' }[t] || 'info'
    },
    signOf(t) {
      return (TRANSACTION_TYPE[t] && TRANSACTION_TYPE[t].sign) || ''
    },
    amtClass(t) {
      return { 1: 'amt-in', 2: 'amt-out', 3: 'amt-in', 4: 'amt-adj' }[t] || ''
    },
    detailText(detail) {
      if (detail == null) return '-'
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) return detail.join(', ')
      if (typeof detail === 'object') {
        return Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join(' · ')
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
  gap: var(--space);
  margin-bottom: var(--space-md);
}
.page-head h2 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin: 0;
}
.amt-in {
  color: var(--success);
  font-weight: 600;
}
.amt-out {
  color: var(--error);
  font-weight: 600;
}
.amt-adj {
  color: var(--info);
}
@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
