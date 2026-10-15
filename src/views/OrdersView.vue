<template>
  <div class="orders">
    <!-- 页头带 -->
    <PageBand
      :crumb="[{ text: '首页', to: '/' }, { text: '订单' }]"
      title="我的订单"
      desc="按创建时间倒序。点任意一行查看订单详情：成功项给出实例与到期时间，失败项给出原因与退款单号。"
    >
      <template #side>
        <div class="band-stat">
          <b class="figure">{{ counts.all == null ? '—' : counts.all }}</b>
          <span>全部订单</span>
        </div>
        <div class="band-stat">
          <b class="figure">{{ counts[0] == null ? '—' : counts[0] }}</b>
          <span>待支付</span>
        </div>
      </template>
    </PageBand>

    <div class="body">
      <KpiRow :items="kpis" />

      <Panel class="mt" title="订单列表" :small="`共 ${total} 条`">
        <template #actions>
          <!-- 状态筛选：PC 行内 tabs；移动端收进底部抽屉（同一份 tabs 配置） -->
          <div v-if="!isMobile" class="tabs">
            <button
              v-for="t in tabs"
              :key="t.label"
              class="tab"
              :class="{ active: status === t.value }"
              @click="switchTab(t.value)"
            >
              {{ t.label }}
            </button>
          </div>
          <button v-else class="filter-btn" @click="drawer = true">
            筛选：{{ statusLabel }} <span class="caret">▾</span>
          </button>
        </template>

        <!-- 出错 -->
        <EmptyState v-if="error" :description="errMsg">
          <el-button type="primary" @click="load">重新加载</el-button>
        </EmptyState>

        <!-- 加载中 / 有数据 / 正在筛选：分页表格（PC 表格 / 移动卡片自动切换 + 分页） -->
        <PagedTable
          v-else-if="loading || total > 0 || status !== ''"
          :columns="columns"
          :rows="rows"
          :loading="loading"
          :total="total"
          :page="page"
          :size="size"
          row-key="order_id"
          @page-change="onPageChange"
          @size-change="onSizeChange"
          @row-click="onRowClick"
        >
          <!-- PC 表格的自定义单元格 -->
          <template #cell-summary="{ row }">
            <span class="ellipsis">{{ row.summary }}</span>
          </template>
          <template #cell-total_cents="{ row }">
            <AmountText :cents="row.total_cents" strong />
          </template>
          <template #cell-status="{ row }">
            <StatusTag type="order" :value="row.status" />
          </template>
          <template #cell-created_at="{ row }">
            {{ formatTime(row.created_at) }}
          </template>

          <!-- 空态（表内）：筛选无结果时给出口，别让用户卡住 -->
          <template #empty>
            <EmptyState :description="status === '' ? '暂无订单' : `没有「${statusLabel}」的订单`">
              <el-button v-if="status !== ''" type="primary" @click="switchTab('')">查看全部订单</el-button>
              <el-button v-else type="primary" @click="$router.push('/products')">去逛商品</el-button>
            </EmptyState>
          </template>

          <!-- 移动端卡片：订单号 + 状态 + 金额 + 时间 -->
          <template #mobile="{ row }">
            <div class="m-top">
              <span class="m-no">{{ row.order_no }}</span>
              <StatusTag type="order" :value="row.status" />
            </div>
            <div class="m-sum">{{ row.summary }}</div>
            <div class="m-bot">
              <AmountText :cents="row.total_cents" strong />
              <span class="m-time">{{ formatTime(row.created_at) }}</span>
            </div>
          </template>
        </PagedTable>

        <!-- 真的一条订单都没有（且没在筛选）：引导去逛商品 -->
        <EmptyState v-else description="还没有订单，去挑一个吧">
          <el-button type="primary" @click="$router.push('/products')">去逛商品</el-button>
        </EmptyState>
      </Panel>
    </div>

    <SiteFooter
      statement="开通结果与退款去向都在订单详情里按项展示。"
      action-text="去逛商品"
      action-to="/products"
    />

    <!-- 移动端筛选抽屉 -->
    <el-drawer v-model="drawer" direction="btt" size="auto" title="按状态筛选">
      <button
        v-for="t in tabs"
        :key="t.label"
        class="drawer-item"
        :class="{ active: status === t.value }"
        @click="switchTab(t.value)"
      >
        {{ t.label }}
      </button>
    </el-drawer>
  </div>
</template>

<script>
import { api } from '../api'
import { PagedTable, StatusTag, AmountText, EmptyState, PageBand, Panel, KpiRow, SiteFooter } from '../components'
import { formatTime, formatCents } from '../utils/format'
import { ORDER_STATUS_TABS } from '../utils/constants'
import { errorText } from '../utils/errors'
import { useIsMobile } from '../utils/breakpoint'

/**
 * 订单列表行适配：后端 GET /shop/orders 的字段为
 * order_id / order_no / total_cents / status / created_at / paid_at / items[]
 * （items 项含 name / sku_id / quantity）。商品概要由 items 派生，接口没有 summary 字段。
 */
function normalizeRow(o) {
  const items = Array.isArray(o.items) ? o.items : []
  const summary = items.length
    ? items.map(i => `${i.name || i.sku_id || '商品'} ×${i.quantity || 1}`).join('，')
    : '-'
  return {
    order_id: o.order_id,
    order_no: o.order_no || '-',
    total_cents: o.total_cents,
    status: o.status,
    created_at: o.created_at,
    summary
  }
}

export default {
  name: 'OrdersView',
  components: { PagedTable, StatusTag, AmountText, EmptyState, PageBand, Panel, KpiRow, SiteFooter },
  setup() {
    // 移动端才用抽屉筛选；与服务端筛选参数无关
    const isMobile = useIsMobile()
    return { isMobile }
  },
  data() {
    return {
      // 后端已支持 status 筛选参数（2026-10-10 加入，Swagger 可查），
      // 所以筛选和分页都走服务端、只拉当前页，不再受 size 上限（100）的影响。
      rows: [],
      total: 0,
      page: 1,
      size: 20,
      status: '', // '' = 全部
      drawer: false,
      loading: true,
      error: false,
      // 竞态保护用：每次 load 自增，只认最后一次请求的结果
      loadSeq: 0,
      errMsg: '订单加载失败，请稍后重试',
      // 各状态订单数：用 size=1 只读 total，4 个轻请求；失败则该格显示 —
      counts: { all: null, 0: null, 1: null, 2: null, 3: null },
      tabs: ORDER_STATUS_TABS,
      columns: [
        { key: 'order_no', label: '订单号', minWidth: 170 },
        { key: 'summary', label: '商品', minWidth: 200 },
        { key: 'total_cents', label: '总金额', width: 120, align: 'right' },
        { key: 'status', label: '状态', width: 110 },
        { key: 'created_at', label: '下单时间', width: 170 }
      ]
    }
  },
  computed: {
    statusLabel() {
      const hit = this.tabs.find(t => t.value === this.status)
      return hit ? hit.label : '全部'
    },
    /** 指标：状态数量来自服务端 total（size=1），累计消费取当前页合计 */
    kpis() {
      const pageSum = this.rows.reduce((s, r) => s + Number(r.total_cents || 0), 0)
      return [
        { label: '全部订单', value: this.counts.all == null ? '-' : String(this.counts.all), unit: '笔' },
        { label: '待支付', value: this.counts[0] == null ? '-' : String(this.counts[0]), unit: '笔' },
        { label: '开通成功', value: this.counts[2] == null ? '-' : String(this.counts[2]), unit: '笔' },
        { label: '当前页金额合计', value: formatCents(pageSum) }
      ]
    }
  },
  created() {
    this.load()
    this.loadCounts()
  },
  methods: {
    formatTime,
    /** 各状态订单数：4 个 size=1 的轻请求读 total，互不阻塞 */
    async loadCounts() {
      const jobs = [
        ['all', {}],
        [0, { status: 0 }],
        [1, { status: 1 }],
        [2, { status: 2 }],
        [3, { status: 3 }]
      ].map(async ([key, extra]) => {
        try {
          const d = await api.getOrders({ page: 1, size: 1, ...extra })
          this.counts[key] = (d && d.total) || 0
        } catch (e) {
          this.counts[key] = null
        }
      })
      await Promise.allSettled(jobs)
    },
    async load() {
      // 竞态保护：快速切筛选/翻页会并发多个请求，先发的若后返回会覆盖新数据。
      // 自增序号，只认最后一次请求的结果。
      const seq = ++this.loadSeq
      this.loading = true
      this.error = false
      try {
        // 服务端筛选 + 服务端分页（后端已支持 status 参数）
        const params = { page: this.page, size: this.size }
        if (this.status !== '') params.status = this.status
        const data = await api.getOrders(params)
        if (seq !== this.loadSeq) return
        this.rows = ((data && data.list) || []).map(normalizeRow)
        this.total = (data && data.total) || 0
      } catch (e) {
        if (seq !== this.loadSeq) return
        this.error = true
        this.rows = []
        this.total = 0
        this.errMsg = errorText(e) || '订单加载失败，请稍后重试'
      } finally {
        if (seq === this.loadSeq) this.loading = false
      }
    },
    switchTab(value) {
      this.drawer = false
      if (this.status === value) return
      this.status = value
      this.page = 1
      this.load()
    },
    onPageChange(p) {
      this.page = p
      this.load()
    },
    onSizeChange(s) {
      this.size = s
      this.page = 1
      this.load()
    },
    onRowClick(row) {
      this.$router.push({ name: 'order-detail', params: { id: row.order_id } })
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
.body > * + * {
  margin-top: var(--s-5);
}
.mt {
  margin-top: var(--s-5);
}
/* 页头带右侧的关键数字（深色底上） */
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

/* 状态筛选（放在面板头的动作槽里） */
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}
.tab {
  padding: 7px 16px;
  border: 1px solid var(--line);
  background: var(--bg-0);
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.tab:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.tab.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}
/* 移动端筛选按钮（面板头里） */
.filter-btn {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  background: var(--bg-0);
  border: 1px solid var(--line-2);
  border-radius: var(--r-pill);
  font-family: inherit;
  font-size: var(--font-sm);
  color: var(--ink);
  cursor: pointer;
  white-space: nowrap;
}
.filter-btn .caret {
  color: var(--ink-3);
}
.drawer-item {
  width: 100%;
  min-height: 48px;
  margin-bottom: var(--s-2);
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  font-family: inherit;
  font-size: var(--font-base);
  color: var(--ink);
  cursor: pointer;
}
.drawer-item.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
  font-weight: 600;
}

.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 移动端卡片内部 */
.m-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  margin-bottom: var(--s-1);
}
.m-no {
  font-size: var(--font-sm);
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-sum {
  font-size: var(--font-sm);
  color: var(--ink);
  margin-bottom: var(--s-1);
}
.m-bot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
}
.m-time {
  font-size: var(--font-xs);
  color: var(--ink-3);
  white-space: nowrap;
}

/* ── 移动端 ── */
@media (max-width: 768px) {
  .body {
    padding: var(--s-4) var(--s-3) var(--s-10);
  }
  /* 触控目标 ≥ 44px：筛选按钮太小手指点不准 */
  .tab {
    min-height: 44px;
    padding: 10px 18px;
    display: inline-flex;
    align-items: center;
  }
}
</style>
