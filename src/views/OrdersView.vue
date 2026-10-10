<template>
  <div class="orders">
    <!-- 页头 -->
    <div class="page-head">
      <h2>我的订单</h2>
      <p class="sub">点任意一行查看订单详情</p>
    </div>

    <!-- 状态筛选 -->
    <div class="tabs">
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

    <!-- 出错 -->
    <EmptyState v-if="error" :description="errMsg">
      <el-button type="primary" @click="load">重新加载</el-button>
    </EmptyState>

    <!-- 加载中 / 有数据 / 正在筛选：交给板块 A 的分页表格（PC 表格 / 移动卡片自动切换 + 分页） -->
    <PagedTable
      v-else-if="loading || total > 0 || status !== ''"
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :size="size"
      row-key="order_id"
      :empty-text="status === '' ? '暂无订单' : '该状态下没有订单'"
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
  </div>
</template>

<script>
import { api } from '../api'
import { PagedTable, StatusTag, AmountText, EmptyState } from '../components'
import { formatTime } from '../utils/format'

/**
 * ★ 订单列表接口的字段适配（唯一改动点）
 * 契约里没有定义这个接口，字段形状以后端真实样例为准。
 * 后端样例来了之后，只改这个函数，页面其它地方不用动。
 */
function normalizeRow(o) {
  const summary =
    o.summary ||
    (Array.isArray(o.items)
      ? o.items.map(i => `${i.name || i.sku_id || '商品'} ×${i.quantity || 1}`).join('，')
      : '') ||
    '-'
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
  components: { PagedTable, StatusTag, AmountText, EmptyState },
  data() {
    return {
      // 后端已支持 status 筛选参数（2026-10-10 加入，Swagger 可查），
      // 所以筛选和分页都走服务端、只拉当前页，不再受 size 上限（100）的影响。
      rows: [],
      total: 0,
      page: 1,
      size: 20,
      status: '', // '' = 全部
      loading: true,
      error: false,
      errMsg: '订单加载失败，请稍后重试',
      // 订单状态：0 待支付 · 1 部分成功 · 2 全部成功 · 3 全部失败
      tabs: [
        { value: '', label: '全部' },
        { value: 0, label: '待支付' },
        { value: 1, label: '部分成功' },
        { value: 2, label: '全部成功' },
        { value: 3, label: '全部失败' }
      ],
      columns: [
        { key: 'order_no', label: '订单号', minWidth: 170 },
        { key: 'summary', label: '商品', minWidth: 200 },
        { key: 'total_cents', label: '总金额', width: 120, align: 'right' },
        { key: 'status', label: '状态', width: 110 },
        { key: 'created_at', label: '下单时间', width: 170 }
      ]
    }
  },
  created() {
    this.load()
  },
  methods: {
    formatTime,
    async load() {
      this.loading = true
      this.error = false
      try {
        // 服务端筛选 + 服务端分页（后端已支持 status 参数）
        const params = { page: this.page, size: this.size }
        if (this.status !== '') params.status = this.status
        const data = await api.getOrders(params)
        this.rows = ((data && data.list) || []).map(normalizeRow)
        this.total = (data && data.total) || 0
      } catch (e) {
        this.error = true
        this.rows = []
        this.total = 0
        this.errMsg = this.readableError(e)
      } finally {
        this.loading = false
      }
    },
    switchTab(value) {
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
    },
    // 错误一律转中文人话，不出现"未知错误"
    readableError(e) {
      if (!e) return '订单加载失败，请稍后重试'
      // 1001 的 data.errors 是「字符串数组」
      if (e.data && Array.isArray(e.data.errors) && e.data.errors.length) {
        return e.data.errors.join('；')
      }
      return e.message || '订单加载失败，请稍后重试'
    }
  }
}
</script>

<style scoped>
.page-head {
  margin-bottom: var(--space-md);
}
.page-head h2 {
  font-size: var(--font-xl);
  margin-bottom: var(--space-xs);
}
.sub {
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

/* 状态筛选（与商品页保持一致的观感） */
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}
.tab {
  padding: 7px 16px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  border-radius: var(--radius);
  font-size: var(--font-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.tab:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
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
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}
.m-no {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-sum {
  font-size: var(--font-sm);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}
.m-bot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}
.m-time {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ── 移动端 ── */
@media (max-width: 768px) {
  /* 触控目标 ≥ 44px：筛选按钮太小手指点不准 */
  .tab {
    min-height: 44px;
    padding: 10px 18px;
    display: inline-flex;
    align-items: center;
  }
  /* 分页器也是触控目标：A 组 PagedTable 用的是 el-pagination 默认尺寸（约 32px）。
     用 :deep() 从外层放大，不修改 A 组的组件文件。 */
  .orders :deep(.el-pagination) {
    --el-pagination-button-height: 44px;
    --el-pagination-button-width: 44px;
  }
  .orders :deep(.el-pagination button),
  .orders :deep(.el-pager li) {
    min-width: 44px;
    height: 44px;
    line-height: 44px;
    font-size: var(--font-base);
  }
}
</style>
