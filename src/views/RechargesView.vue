<template>
  <div class="recharges">
    <div class="page-head" v-reveal>
      <h2>充值记录</h2>
      <el-radio-group v-model="status" @change="onFilter">
        <el-radio-button :value="''">全部</el-radio-button>
        <el-radio-button :value="0">待核销</el-radio-button>
        <el-radio-button :value="1">已到账</el-radio-button>
        <el-radio-button :value="2">已驳回</el-radio-button>
      </el-radio-group>
    </div>

    <PagedTable v-reveal="{ delay: 100 }" :columns="columns" :rows="rows" :loading="loading" :total="total"
      :page="page" :size="size" empty-text="暂无充值记录"
      @page-change="onPage" @size-change="onSize">
      <template #cell-amount_cents="{ row }">
        <AmountText :cents="row.amount_cents" strong />
      </template>
      <template #cell-status="{ row }">
        <StatusTag type="recharge" :value="row.status" />
      </template>
      <template #cell-balance_after="{ row }">
        <AmountText :cents="row.balance_after" />
      </template>
      <template #cell-reject_reason="{ row }">
        {{ row.reject_reason || '-' }}
      </template>
    </PagedTable>
  </div>
</template>

<script>
import { api } from '../api'
import { formatTime } from '../utils/format'
import { AmountText, StatusTag, PagedTable } from '../components'

export default {
  name: 'RechargesView',
  components: { AmountText, StatusTag, PagedTable },
  data() {
    return {
      status: '',
      rows: [],
      total: 0,
      page: 1,
      size: 20,
      loading: false,
      columns: [
        { key: 'apply_id', label: '申请号', width: 90 },
        { key: 'amount_cents', label: '申请金额' },
        { key: 'status', label: '状态' },
        { key: 'balance_after', label: '到账后余额' },
        { key: 'reject_reason', label: '驳回原因' },
        { key: 'created_at', label: '申请时间', formatter: row => formatTime(row.created_at) }
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
        const data = await api.getRecharges({ page: this.page, size: this.size, status: this.status })
        this.rows = data.list
        this.total = data.total
      } catch (e) {
        this.rows = []
        this.total = 0
      } finally {
        this.loading = false
      }
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
@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
