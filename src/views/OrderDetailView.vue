<template>
  <div class="order-detail">
    <!-- 页头带：订单号作为标题，右侧给应付与状态 -->
    <PageBand
      :crumb="[{ text: '首页', to: '/' }, { text: '我的订单', to: '/orders' }, { text: '订单详情' }]"
      :title="order ? order.order_no || '订单详情' : '订单详情'"
      desc="按项展示开通结果：成功项给出实例与到期时间，失败项给出原因与退款单号。"
    >
      <template #side>
        <div class="band-stat">
          <b class="figure">{{ order ? formatCents(dueCents) : '—' }}</b>
          <span>应付金额</span>
        </div>
        <div class="band-stat">
          <b class="figure">{{ statusWord }}</b>
          <span>订单状态</span>
        </div>
      </template>
    </PageBand>

    <div class="body">
      <!-- 首次加载骨架 -->
      <LoadingBox v-if="loading && !order" :loading="loading" :rows="5" />

      <!-- 错误态：4001 统一为「订单不存在或无权查看」（后端有意不区分他人订单） -->
      <EmptyState v-else-if="loadError" :description="loadError">
        <el-button type="primary" @click="$router.push('/orders')">返回订单列表</el-button>
        <el-button @click="load">重新加载</el-button>
      </EmptyState>

      <template v-else-if="order">
      <!-- 订单头：状态 + 金额 + 关键时间 -->
      <div class="head-card">
        <div class="head-top">
          <StatusTag type="order" :value="order.status" />
          <span v-if="processing" class="poll-badge">开通中</span>
        </div>
        <div class="head-amount">
          <AmountText :cents="order.total_cents" size="lg" strong />
          <small>订单总额</small>
        </div>
        <div class="meta">
          <div class="kv"><span>订单号</span><b>{{ order.order_no || '-' }}</b></div>
          <div class="kv"><span>下单时间</span><b>{{ formatTime(order.created_at) }}</b></div>
          <div class="kv">
            <span>支付时间</span>
            <b>{{ order.paid_at ? formatTime(order.paid_at) : '-' }}</b>
          </div>
        </div>
      </div>

      <!-- 进度时间线（移动端竖排） -->
      <div class="timeline">
        <div
          v-for="(s, i) in timeline"
          :key="i"
          class="tl-item"
          :class="{ done: s.done, active: s.active }"
        >
          <span class="tl-dot" />
          <div class="tl-body">
            <b>{{ s.title }}</b>
            <small>{{ s.desc }}</small>
          </div>
        </div>
      </div>

      <!-- 处理中 / 超时出口 -->
      <div v-if="polling && !pollTimedOut" class="notice processing">
        <span class="spinner" />
        <span>正在开通，通常几秒内完成…（已等待 {{ pollSeconds }}s）</span>
      </div>
      <div v-else-if="pollTimedOut" class="notice timeout">
        <span>开通仍在进行中，可稍后刷新查看结果（不影响已扣费与后续自动退款）</span>
        <el-button size="small" type="primary" @click="manualRefresh">刷新</el-button>
      </div>

      <!-- 订单项：按项渲染，5 种状态各一套视觉 -->
      <div class="items-card">
        <h3 class="card-title">
          订单明细
          <small>共 {{ items.length }} 项 · 成功 {{ okCount }} · 失败已退款 {{ failCount }}</small>
        </h3>

        <div v-for="it in items" :key="it.item_id" class="item" :class="'tone-' + toneOf(it.status)">
          <div class="item-top">
            <div class="item-name">
              <b>{{ it.name || it.sku_id || '商品' }}</b>
              <small>
                {{ productLineName(it.product_code) }}<template v-if="it.sku_id"> · {{ it.sku_id }}</template>
              </small>
            </div>
            <StatusTag type="orderItem" :value="it.status" />
          </div>

          <div class="item-body">
            <!-- ⚠️ 后端语义：订单项的 price_cents 是「该项小计」（已含数量），不是单价。
                 实测样例：quantity=2 且 price_cents=20000 时 order.total_cents 也是 20000。
                 所以这里只展示数量与小计，绝不能再用 price_cents × quantity。 -->
            <div class="kv">
              <span>数量</span>
              <b>×{{ it.quantity }}</b>
            </div>
            <div class="kv">
              <span>小计</span>
              <b><AmountText :cents="it.price_cents" strong /></b>
            </div>

            <!-- 2 开通成功：实例与到期时间 -->
            <template v-if="Number(it.status) === 2">
              <div class="kv"><span>实例 ID</span><b class="mono">{{ it.instance_id || '-' }}</b></div>
              <div class="kv"><span>到期时间</span><b>{{ it.expire_at ? formatTime(it.expire_at) : '-' }}</b></div>
            </template>

            <!-- 1 已支付（开通中） -->
            <div v-else-if="Number(it.status) === 1" class="item-hint processing">正在开通，请稍候…</div>

            <!-- 3 失败待退款 / 4 已退款 -->
            <template v-else-if="Number(it.status) === 3 || Number(it.status) === 4">
              <div class="kv">
                <span>失败原因</span>
                <b class="danger">{{ failReasonText(it.fail_reason) }}</b>
              </div>
              <template v-if="Number(it.status) === 4">
                <div class="kv">
                  <span>退款时间</span>
                  <b>{{ it.refunded_at ? formatTime(it.refunded_at) : '-' }}</b>
                </div>
                <div v-if="it.refund_bill_no" class="kv">
                  <span>退款单号</span>
                  <b class="mono">{{ it.refund_bill_no }}</b>
                  <el-button link type="primary" @click="$router.push('/wallet/transactions')">查看流水</el-button>
                </div>
              </template>
              <div v-else class="item-hint warn">退款处理中，长时间未到账请联系平台</div>
            </template>

            <!-- 0 待支付 -->
            <div v-else class="item-hint">尚未支付</div>
          </div>
        </div>
      </div>

      <!-- 底部固定操作栏：仅在仍有待支付项时给支付入口 -->
      <div v-if="dueCents > 0" class="action-bar">
        <div class="bar-left">
          <span class="bar-label">应付</span>
          <AmountText :cents="dueCents" size="lg" strong />
        </div>
        <el-button
          class="bar-btn"
          type="primary"
          size="large"
          :loading="paying"
          :disabled="paying || isFrozen"
          @click="onPay"
        >
          {{ isFrozen ? '钱包已冻结' : '立即支付' }}
        </el-button>
      </div>
      </template>
    </div>

    <SiteFooter
      statement="开通成功后即可在产品前端使用实例；失败项已自动退款。"
      action-text="返回订单列表"
      action-to="/orders"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
// ElMessage / ElMessageBox 由 unplugin-auto-import 按需注入（见 vite.config.js）
import { api } from '../api'
import { useUserStore } from '../store'
import { formatCents, formatTime } from '../utils/format'
import { failReasonText, productLineName, ORDER_STATUS } from '../utils/constants'
import { errorList, errorText } from '../utils/errors'
import { AmountText, StatusTag, EmptyState, LoadingBox, PageBand, SiteFooter } from '../components'

// 轮询规程（后端答复 §2 D-Q6）：1.5s 一次、最长 60s；详情接口不限流
const POLL_INTERVAL = 1500
const POLL_TIMEOUT = 60000
// 订单项终态：2 开通成功 / 3 失败待退款 / 4 已退款
const ITEM_SETTLED = [2, 3, 4]

export default {
  name: 'OrderDetailView',
  components: { AmountText, StatusTag, EmptyState, LoadingBox, PageBand, SiteFooter },
  data() {
    return {
      order: null,
      loading: true,
      loadError: '',
      paying: false,
      polling: false,
      pollTimedOut: false,
      pollSeconds: 0,
      pollTimer: null,
      pollStart: 0,
      // 卸载标志：轮询的 setTimeout 回调里 await 之后要靠它判活，
      // 否则「定时器已触发 + 请求在飞行中」时离开页面，回调会重新排定时器让轮询复活
      destroyed: false
    }
  },
  computed: {
    ...mapState(useUserStore, ['isFrozen']),
    items() {
      return (this.order && this.order.items) || []
    },
    /** 页头带右侧：订单状态中文（深色底上只放一个字词） */
    statusWord() {
      if (!this.order) return '—'
      const hit = ORDER_STATUS[Number(this.order.status)]
      return hit ? hit.text : '—'
    },
    /** 判"处理中"看订单项：受理那一刻订单 status 就已经是 1 */
    processing() {
      return this.items.some(it => Number(it.status) === 1)
    },
    okCount() {
      return this.items.filter(it => Number(it.status) === 2).length
    },
    failCount() {
      return this.items.filter(it => [3, 4].includes(Number(it.status))).length
    },
    /** 应付金额 = 所有待支付项的「小计」之和
     *  ⚠️ price_cents 已经是该项小计（含数量），不要再乘 quantity */
    dueCents() {
      return this.items
        .filter(it => Number(it.status) === 0)
        .reduce((sum, it) => sum + Number(it.price_cents || 0), 0)
    },
    timeline() {
      const items = this.items
      const paid = !!this.order.paid_at || items.some(it => Number(it.status) > 0)
      const settled = items.length > 0 && items.every(it => ITEM_SETTLED.includes(Number(it.status)))
      const waitingPay = items.some(it => Number(it.status) === 0)
      return [
        { title: '提交订单', desc: formatTime(this.order.created_at), done: true, active: false },
        {
          title: '支付',
          desc: paid ? (this.order.paid_at ? formatTime(this.order.paid_at) : '已扣费') : '待支付',
          done: paid,
          active: !paid && waitingPay
        },
        {
          title: '开通实例',
          desc: this.processing ? '正在开通…' : settled ? '已完成' : paid ? '等待开通' : '未开始',
          done: settled,
          active: this.processing
        },
        {
          title: '结果',
          desc: settled ? `${this.okCount} 项成功 · ${this.failCount} 项失败已退款` : '等待开通结果',
          done: settled,
          active: false
        }
      ]
    }
  },
  created() {
    this.load()
  },
  beforeUnmount() {
    // 置标志要在 stopPoll 之前：定时器可能已触发、请求还在飞行中，靠它挡住回调里的续排
    this.destroyed = true
    this.stopPoll()
  },
  watch: {
    // 同一个路由记录内换订单（/orders/1 → /orders/2）时组件实例会被复用、created 不会重跑，
    // 不监听就会一直显示上一个订单，轮询还会继续打旧 id
    '$route.params.id'() {
      if (this.destroyed) return
      this.stopPoll()
      this.pollTimedOut = false
      this.load()
    }
  },
  methods: {
    ...mapActions(useUserStore, ['refreshBalance']),
    formatTime,
    formatCents,
    productLineName,
    failReasonText,
    /** 订单项状态 → 左侧色条（5 态各一套视觉，取值同 StatusTag） */
    toneOf(status) {
      return { 0: 'info', 1: 'primary', 2: 'success', 3: 'warning', 4: 'refunded' }[Number(status)] || 'info'
    },

    async load() {
      this.loading = true
      try {
        const data = await api.getOrder(this.$route.params.id)
        this.order = data || null
        this.loadError = data ? '' : '订单加载失败，请稍后重试'
        // 进页面时若仍有项在开通中（比如离页后再回来），自动续轮询
        if (this.order && this.processing) this.startPoll()
      } catch (e) {
        this.order = null
        // 4001：他人订单与不存在的订单都返它，文案统一
        this.loadError = Number(e && e.code) === 4001
          ? '订单不存在或无权查看'
          : errorText(e) || '订单加载失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },

    async manualRefresh() {
      this.pollTimedOut = false
      await this.load()
      if (this.order && this.processing) this.startPoll()
    },

    /** /pay 返回的也是订单结构；按 item_id 合并，避免只回受理项时丢项 */
    applyOrder(res) {
      if (!res) return
      const prev = this.order || {}
      const map = new Map((prev.items || []).map(i => [String(i.item_id), i]))
      ;(res.items || []).forEach(i => map.set(String(i.item_id), i))
      this.order = { ...prev, ...res, items: map.size ? [...map.values()] : prev.items || [] }
    },

    async onPay() {
      // 防重复提交（后端另有订单级幂等 + 悲观写锁，前端本地防抖足够）
      if (this.paying || this.polling) return
      if (this.isFrozen) {
        ElMessage.warning('钱包已冻结，请联系平台解冻后再支付')
        return
      }
      if (this.dueCents <= 0) {
        ElMessage.info('该订单没有待支付的项')
        return
      }
      this.paying = true
      this.pollTimedOut = false
      try {
        const res = await api.payOrder(this.$route.params.id)
        // code === 0 只代表已受理：扣费同步完成、开通异步，结果靠轮询详情
        this.applyOrder(res)
        const accepted = Number((res && res.accepted_items) || 0)
        ElMessage.success(accepted > 0 ? `已受理 ${accepted} 项，正在开通` : '支付已受理，正在开通')
        // 扣费是同步的：受理成功时钱已经从余额扣掉了，顶栏余额要立刻更新
        this.refreshBalance()
        this.startPoll()
      } catch (e) {
        this.handlePayError(e)
      } finally {
        this.paying = false
      }
    },

    handlePayError(e) {
      const code = Number(e && e.code)
      // 4002：开通中重复支付、终态重复支付都返它 —— 不是失败，直接进轮询
      if (code === 4002) {
        ElMessage.info('订单已在处理中，请稍候')
        this.startPoll()
        return
      }
      // 3001：余额不足。data 是 null，必须另查余额算差额；不要自动重试
      if (code === 3001) {
        this.notifyInsufficient()
        return
      }
      // 3002：钱包冻结 —— 不引导充值，只提示联系平台
      if (code === 3002) {
        ElMessage.error('钱包已冻结，请联系平台')
        this.refreshBalance()
        return
      }
      // 4001：订单不存在或无权查看
      if (code === 4001) {
        ElMessage.error('订单不存在或无权查看')
        this.$router.push('/orders')
        return
      }
      // 其余（含 1001 字符串数组）逐条弹中文人话
      const list = errorList(e)
      if (list.length) list.forEach(m => ElMessage.error(m))
    },

    /** 余额不足：另查余额算「还差多少」，再问是否去充值 */
    async notifyInsufficient() {
      let balance = 0
      try {
        const b = await api.getBalance()
        balance = Number((b && b.balance_cents) || 0)
        this.refreshBalance()
      } catch (err) {
        balance = 0
      }
      const gap = Math.max(0, this.dueCents - balance)
      ElMessageBox.confirm(
        `钱包余额不足${gap > 0 ? `，还差 ${formatCents(gap)}` : ''}。是否现在去充值？`,
        '余额不足',
        { confirmButtonText: '去充值', cancelButtonText: '稍后再说', type: 'warning' }
      )
        .then(() => this.$router.push('/wallet/recharge'))
        .catch(() => {})
    },

    startPoll() {
      if (this.polling) return
      this.polling = true
      this.pollTimedOut = false
      this.pollStart = Date.now()
      this.pollSeconds = 0
      // 第一次先无条件拉一次详情：本地状态可能已过期（例如 4002 竞态时本地还显示待支付），
      // 直接按本地状态判断会立刻"结束轮询"，反而拿不到真实结果
      this.tick(true)
    },

    stopPoll() {
      if (this.pollTimer) {
        clearTimeout(this.pollTimer)
        this.pollTimer = null
      }
      this.polling = false
    },

    async tick(first = false) {
      // 停止条件：没有任何项处于 status===1（status===0 的未付项也不该继续等）。
      // first=true 时跳过判断，先把后端最新状态拿回来
      if (!first && !this.processing) {
        this.finishPoll()
        return
      }
      const elapsed = Date.now() - this.pollStart
      if (elapsed >= POLL_TIMEOUT) {
        // 超时不报错：显示「处理中 + 刷新」，不打断用户
        this.polling = false
        this.pollTimedOut = true
        return
      }
      this.pollSeconds = Math.round(elapsed / 1000)
      this.pollTimer = setTimeout(async () => {
        try {
          const data = await api.getOrder(this.$route.params.id)
          // 请求飞行期间可能已经离开页面：此时不能再 applyOrder / 弹提示 / 续排定时器，
          // 否则轮询会在后台自我复活（SPA 里每次进出都会多留一条链）
          if (this.destroyed) return
          if (data) this.applyOrder(data)
        } catch (e) {
          if (this.destroyed) return
          // 单次轮询失败不打断流程（1003 由拦截器自动 refresh 后重放）；
          // 但订单已不存在就没必要继续轮询
          if (Number(e && e.code) === 4001) {
            this.stopPoll()
            this.loadError = '订单不存在或无权查看'
            return
          }
        }
        if (this.destroyed) return
        this.tick()
      }, POLL_INTERVAL)
    },

    finishPoll() {
      this.stopPoll()
      this.pollTimedOut = false
      if (this.failCount && this.okCount) {
        ElMessage.warning(`部分成功：${this.okCount} 项开通成功，${this.failCount} 项失败已退款`)
      } else if (this.failCount) {
        ElMessage.error(`开通失败：${this.failCount} 项失败，已自动退款`)
      } else if (this.okCount) {
        ElMessage.success('开通完成')
      }
      // 有失败项会自动退款，余额已变化，顶栏余额同步刷新
      if (this.failCount) this.refreshBalance()
    }
  }
}
</script>

<style scoped>
/* 通栏内容区（首页格式）：背景铺满屏幕，内容居中（详情页窄一点更好读） */
.body {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  background: var(--bg-1);
  padding: var(--s-7) var(--s-6) var(--s-11);
}
.body > * {
  width: 100%;
  max-width: 860px;
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

/* ── 订单头 ── */
.head-card {
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: var(--s-5);
}
.head-top {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin-bottom: var(--s-3);
}
.poll-badge {
  font-size: var(--font-xs);
  color: var(--brand);
  background: var(--brand-weak);
  border-radius: var(--r-pill);
  padding: 3px 10px;
  font-weight: 600;
}
.head-amount {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  margin-bottom: var(--s-4);
}
.head-amount small {
  color: var(--ink-3);
  font-size: var(--font-sm);
}
.meta {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}
.kv {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--font-sm);
}
.kv > span:first-child {
  color: var(--ink-3);
  min-width: 72px;
  flex-shrink: 0;
}
.kv > b {
  color: var(--ink);
  font-weight: 600;
  word-break: break-all;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.danger {
  color: var(--danger);
}

/* ── 时间线（竖排） ── */
.timeline {
  padding: var(--s-4) var(--s-5);
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
.tl-item {
  position: relative;
  display: flex;
  gap: var(--s-3);
  padding-bottom: var(--s-3);
}
.tl-item:last-child {
  padding-bottom: 0;
}
.tl-item::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 16px;
  bottom: 0;
  width: 1px;
  background: var(--line-2);
}
.tl-item:last-child::before {
  display: none;
}
.tl-dot {
  width: 11px;
  height: 11px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--bg-2);
  border: 2px solid var(--line-2);
  flex-shrink: 0;
  z-index: 1;
}
.tl-item.done .tl-dot {
  background: var(--success);
  border-color: var(--success);
}
.tl-item.active .tl-dot {
  background: var(--brand);
  border-color: var(--brand);
  box-shadow: 0 0 0 4px var(--brand-weak);
}
.tl-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tl-body b {
  font-size: var(--font-sm);
  color: var(--ink);
}
.tl-item.active .tl-body b {
  color: var(--brand);
}
.tl-body small {
  font-size: var(--font-xs);
  color: var(--ink-3);
}

/* ── 处理中 / 超时提示 ── */
.notice {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-radius: var(--r-md);
  font-size: var(--font-sm);
}
.notice.processing {
  color: var(--brand);
  background: var(--brand-weak);
}
.notice.timeout {
  justify-content: space-between;
  color: var(--warning);
  background: var(--warning-bg);
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--brand-weak-2);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── 订单项 ── */
.items-card {
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: var(--s-5);
}
.card-title {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  font-size: var(--font-md);
  margin: 0 0 var(--s-3);
}
.card-title small {
  font-size: var(--font-xs);
  color: var(--ink-3);
  font-weight: 400;
}
.item {
  border: 1px solid var(--line);
  border-left-width: 3px;
  border-radius: var(--r-md);
  padding: var(--s-3) var(--s-4);
  margin-bottom: var(--s-3);
}
.item:last-child {
  margin-bottom: 0;
}
/* 5 种订单项状态各一套视觉（与 StatusTag 取值一致） */
.tone-info { border-left-color: var(--ink-4); }
.tone-primary { border-left-color: var(--brand); background: var(--brand-weak); }
.tone-success { border-left-color: var(--success); }
.tone-warning { border-left-color: var(--warning); background: var(--warning-bg); }
.tone-refunded { border-left-color: var(--ink-4); background: var(--bg-1); }

.item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
  margin-bottom: var(--s-2);
}
.item-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.item-name b {
  font-size: var(--font-base);
  color: var(--ink);
}
.item-name small {
  font-size: var(--font-xs);
  color: var(--ink-3);
  word-break: break-all;
}
.item-body {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}
.item-hint {
  font-size: var(--font-xs);
  color: var(--ink-3);
}
.item-hint.processing {
  color: var(--brand);
}
.item-hint.warn {
  color: var(--warning);
}

/* ── 底部操作栏 ── */
.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-3) var(--s-4);
  padding-bottom: calc(var(--s-3) + var(--safe-bottom));
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
.bar-left {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
}
.bar-label {
  font-size: var(--font-sm);
  color: var(--ink-3);
}
.bar-btn {
  min-height: 44px;
  padding: 0 28px;
}

@media (max-width: 768px) {
  .body {
    padding: var(--s-4) var(--s-3) 96px; /* 底部留给固定操作栏（本页不显示悬浮胶囊） */
  }
  .head-card,
  .items-card,
  .timeline {
    padding: var(--s-4);
  }
  /* 主操作固定到底部，并避开安全区 */
  .action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    padding: var(--s-3) var(--s-4) calc(var(--s-3) + var(--safe-bottom));
  }
  .kv > span:first-child {
    min-width: 64px;
  }
}
</style>
