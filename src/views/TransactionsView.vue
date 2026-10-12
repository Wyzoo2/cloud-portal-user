<template>
  <div class="transactions">
    <PageBand
      :crumb="[{ text: '首页', to: '/' }, { text: '账户中心', to: '/account' }, { text: '消费流水' }]"
      title="消费流水"
      desc="每一笔充值、扣费、退款与调账都记在这里；时间为后端返回的时间，明细是产品原样传入的 JSON。"
    >
      <template #side>
        <div class="band-stat">
          <b class="figure">{{ total }}</b>
          <span>记录条数</span>
        </div>
        <div class="band-stat">
          <b class="figure">{{ formatCents(pageNet) }}</b>
          <span>当前页净额</span>
        </div>
      </template>
    </PageBand>

    <div class="body">
      <Panel title="资金流水" :small="`共 ${total} 条`">
        <template #actions>
          <el-radio-group v-model="type" @change="onFilter">
            <el-radio-button v-for="t in tabs" :key="t.label" :value="t.value">{{ t.label }}</el-radio-button>
          </el-radio-group>
        </template>

        <PagedTable :columns="columns" :rows="rows" :loading="loading" :total="total"
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
          <template #cell-bill_no="{ row }">
            {{ billNoText(row.bill_no) }}
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
      </Panel>
    </div>

    <SiteFooter
      statement="每一笔充值、扣费、退款与调账都可以在这里核对。"
      action-text="返回账户中心"
      action-to="/account"
    />
  </div>
</template>

<script>
import { api } from '../api'
import { formatTime, formatCents } from '../utils/format'
import {
  TRANSACTION_TYPE, TRANSACTION_TYPE_TABS, productLineName,
  DETAIL_LABELS, failReasonText, skuDisplayName
} from '../utils/constants'
import { AmountText, PagedTable, EmptyState, StatusTag, PageBand, Panel, SiteFooter } from '../components'

/** 明细字段值 → 展示文本：枚举/金额做翻译；嵌套对象不展示，避免渲染出 JSON 字符串 */
function detailValueText(key, v) {
  if (v == null || v === '') return ''
  if (typeof v === 'object') return ''
  if (key === 'product_code') return productLineName(v)
  if (key === 'sku_id') return skuDisplayName(v)
  if (key === 'fail_reason') return failReasonText(v)
  if (key.endsWith('_cents')) return formatCents(Number(v))
  return String(v)
}

export default {
  name: 'TransactionsView',
  components: { AmountText, PagedTable, EmptyState, StatusTag, PageBand, Panel, SiteFooter },
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
        { key: 'amount_cents', label: '金额', width: 120 },
        { key: 'balance_after', label: '变动后余额', width: 120 },
        { key: 'product_code', label: '商品', width: 100 },
        { key: 'detail', label: '明细', minWidth: 220 },
        { key: 'created_at', label: '时间', width: 160, formatter: row => formatTime(row.created_at) },
        { key: 'bill_no', label: '流水号', minWidth: 140 }
      ]
    }
  },
  computed: {
    /** 当前页净额：充值/退款为进，扣费为出（调账按金额正负） */
    pageNet() {
      return this.rows.reduce((sum, r) => {
        const amt = Math.abs(Number(r.amount_cents) || 0)
        const t = Number(r.type)
        if (t === 1 || t === 3) return sum + amt
        if (t === 2) return sum - amt
        return sum + (Number(r.amount_cents) || 0)
      }, 0)
    }
  },
  created() {
    this.load()
  },
  methods: {
    formatTime,
    formatCents,
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
      const parts = this.detailParts(detail)
      return parts.length ? parts.join(' · ') : '-'
    },
    /** 流水号是后端内部幂等键（order:305:item:1 / refund:67:1760… / phone-20261005-000123），
        直接显示是一串看不懂的英文。这里翻译成「订单 305」这样的可读形式。 */
    billNoText(billNo) {
      if (billNo == null || billNo === '') return '-'
      const s = String(billNo)
      // 1) 内部幂等键：{kind}:{编号}[:...]
      const seg = s.split(':')
      const KIND = { order: '订单', refund: '退款', recharge: '充值', deduct: '扣费', adjust: '调账' }
      if (seg.length > 1 && KIND[seg[0]]) {
        return seg[1] ? `${KIND[seg[0]]} ${seg[1]}` : KIND[seg[0]]
      }
      // 2) 产品侧账单号：{product_code}-{日期}-{序号}，把产品线前缀换成中文
      const m = s.match(/^(storage|phone|desktop)-(.+)$/)
      if (m) return `${productLineName(m[1])} ${m[2]}`
      // 3) 其余编号原样展示（本身就是可读的单号）
      return s
    },
    /** detail 是产品传的任意 JSON：只渲染 DETAIL_LABELS 里登记过的字段，避免暴露英文字段名 */
    detailParts(detail) {
      if (detail == null || detail === '') return []
      if (typeof detail === 'string') return [detail]
      if (typeof detail === 'number' || typeof detail === 'boolean') return [String(detail)]
      if (Array.isArray(detail)) return detail.flatMap(d => this.detailParts(d))
      if (typeof detail === 'object') {
        return Object.entries(detail).flatMap(([k, v]) => {
          const label = DETAIL_LABELS[k]
          if (!label) return []
          const text = detailValueText(k, v)
          return text ? [`${label} ${text}`] : []
        })
      }
      return []
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
