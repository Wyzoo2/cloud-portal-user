<template>
  <div class="recharges">
    <PageBand
      :crumb="[{ text: '首页', to: '/' }, { text: '账户中心', to: '/account' }, { text: '充值记录' }]"
      title="充值记录"
      desc="充值走「提交申请 → 线下转账 → 管理员核销 → 余额到账」，这里看核销进度与驳回原因。"
    >
      <template #side>
        <div class="band-stat">
          <b class="figure">{{ total }}</b>
          <span>记录条数</span>
        </div>
      </template>
    </PageBand>

    <div class="body">
      <Panel title="充值申请记录" :small="`共 ${total} 条`">
        <template #actions>
          <el-radio-group v-model="status" @change="onFilter">
            <el-radio-button v-for="t in tabs" :key="t.label" :value="t.value">{{ t.label }}</el-radio-button>
          </el-radio-group>
        </template>

        <PagedTable :columns="columns" :rows="rows" :loading="loading" :total="total"
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
      </Panel>
    </div>

    <SiteFooter
      statement="被驳回的申请会写明原因，可以按同样流程重新提交。"
      action-text="重新充值"
      action-to="/wallet/recharge"
    />
  </div>
</template>

<script>
import { api } from '../api'
import { formatTime } from '../utils/format'
import { RECHARGE_STATUS_TABS } from '../utils/constants'
import { AmountText, StatusTag, PagedTable, EmptyState, PageBand, Panel, SiteFooter } from '../components'

export default {
  name: 'RechargesView',
  components: { AmountText, StatusTag, PagedTable, EmptyState, PageBand, Panel, SiteFooter },
  data() {
    return {
      status: '',
      rows: [],
      total: 0,
      page: 1,
      size: 20,
      loading: false,
      error: false,
      // 竞态保护用：每次 load 自增，只认最后一次请求的结果
      loadSeq: 0,
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
      // 竞态保护：快速切筛选/翻页会并发多个请求，先发的若后返回会覆盖新数据
      const seq = ++this.loadSeq
      this.loading = true
      this.error = false
      try {
        // 「全部」时不传 status，避免后端把空值当成某个具体状态
        const params = { page: this.page, size: this.size }
        if (this.status !== '') params.status = this.status
        const data = await api.getRecharges(params)
        if (seq !== this.loadSeq) return
        this.rows = (data && data.list) || []
        this.total = (data && data.total) || 0
      } catch (e) {
        if (seq !== this.loadSeq) return
        // 失败统一走空态里的「重新加载」，不再额外 toast，避免同一错误两处反馈
        this.error = true
        this.rows = []
        this.total = 0
      } finally {
        if (seq === this.loadSeq) this.loading = false
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
/* 通栏内容区（首页格式）：背景铺满屏幕，内容居中 */
.body {
  background: var(--bg-1);
  padding: var(--s-7) var(--s-6) var(--s-11);
}
.body > * {
  max-width: var(--wrap-app);
  margin-left: auto;
  margin-right: auto;
}
.band-stat {
  text-align: right;
}
.band-stat b {
  display: block;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.band-stat span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}
@media (max-width: 768px) {
  .body {
    padding: var(--s-4) var(--s-3) var(--s-10);
  }
}
</style>
