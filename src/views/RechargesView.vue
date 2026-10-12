<template>
  <div class="recharges">
    <div class="page-head" v-reveal>
      <h2>充值记录</h2>
      <el-radio-group v-model="status" @change="onFilter">
        <el-radio-button v-for="t in tabs" :key="t.label" :value="t.value">{{ t.label }}</el-radio-button>
      </el-radio-group>
    </div>

    <PagedTable v-reveal="{ delay: 100 }" :columns="columns" :rows="rows" :loading="loading" :total="total"
      :page="page" :size="size" row-key="apply_id"
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

      <!-- 空态：无记录引导去充值；加载失败给重试 -->
      <template #empty>
        <EmptyState :description="error ? '充值记录加载失败，请稍后重试' : (status === '' ? '还没有充值记录' : '该状态下没有记录')">
          <el-button v-if="error" type="primary" @click="load">重新加载</el-button>
          <el-button v-else type="primary" @click="$router.push('/wallet/recharge')">去充值</el-button>
        </EmptyState>
      </template>
    </PagedTable>
  </div>
</template>

<script>
import { api } from '../api'
import { formatTime } from '../utils/format'
import { RECHARGE_STATUS_TABS } from '../utils/constants'
import { AmountText, StatusTag, PagedTable, EmptyState } from '../components'

export default {
  name: 'RechargesView',
  components: { AmountText, StatusTag, PagedTable, EmptyState },
  data() {
    return {
      status: '',
      rows: [],
      total: 0,
      page: 1,
      size: 20,
      loading: false,
      error: false,
      tabs: RECHARGE_STATUS_TABS,
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
      this.error = false
      try {
        // 「全部」时不传 status，避免后端把空值当成某个具体状态
        const params = { page: this.page, size: this.size }
        if (this.status !== '') params.status = this.status
        const data = await api.getRecharges(params)
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
  font-weight: 600;
  letter-spacing: -0.3px;
  margin: 0;
}
@media (max-width: 1000px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
