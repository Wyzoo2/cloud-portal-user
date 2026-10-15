<template>
  <div class="products">
    <!-- 页头带：面包屑 + 大标题 + 一句说明 + 右侧关键数字 -->
    <PageBand
      :crumb="[{ text: '首页', to: '/' }, { text: '商品' }]"
      title="商品中心"
      desc="三条产品线的规格与价格实时同步自各产品，下单时按实时价重算；开通失败自动退款，结果在订单详情按项展示。"
    >
      <template #side>
        <div class="band-stat">
          <b class="figure">{{ list.length }}</b>
          <span>在售 SKU</span>
        </div>
        <div class="band-stat">
          <b class="figure">{{ lineCount }}</b>
          <span>可下单产品线</span>
        </div>
      </template>
    </PageBand>

    <div class="body">
      <KpiRow :items="kpis" />

      <Panel class="mt" title="在售商品" small="价格为目录缓存价，下单时以实时价重算">
        <template #actions>
          <!-- 产品线筛选：PC 行内 tabs；移动端收进底部抽屉（同一份 tabs 配置） -->
          <div v-if="!isMobile" class="tabs">
            <button
              v-for="t in tabs"
              :key="t.value"
              class="tab"
              :class="{ active: productCode === t.value }"
              @click="switchTab(t.value)"
            >
              {{ t.label }}
            </button>
          </div>
          <button v-else class="filter-btn" @click="drawer = true">
            筛选：{{ lineFilterLabel }} <span class="caret">▾</span>
          </button>
        </template>

        <LoadingBox :loading="loading" :rows="6">
          <!-- 出错 -->
          <EmptyState v-if="error" :description="errMsg">
            <el-button type="primary" @click="load">重新加载</el-button>
          </EmptyState>

          <!-- 空态：可能是该产品线没货，也可能是后端目录还没同步，给个刷新出口 -->
          <EmptyState v-else-if="!list.length" description="该产品线暂时没有可售商品">
            <el-button type="primary" @click="load">刷新商品</el-button>
          </EmptyState>

          <!-- 商品卡片（1px 发丝线分格，无投影） -->
          <div v-else class="grid">
            <div
              v-for="p in list"
              :key="p.product_code + '/' + p.sku_id"
              class="card"
              :class="{ soldout: isSoldOut(p) }"
            >
              <div class="card-top">
                <span class="line">{{ lineName(p.product_code) }}</span>
                <!-- 库存三态：null/缺失=现货 / 数字=剩 N / 0=售罄 -->
                <span v-if="isSoldOut(p)" class="stock out">已售罄</span>
                <span v-else-if="!isStockKnown(p)" class="stock in">现货</span>
                <span v-else class="stock in">剩 {{ p.stock }}</span>
              </div>

              <h3 class="name">{{ p.name }}</h3>

              <!-- 规格：按后端返回的 key 通用渲染，不假设任何字段 -->
              <div v-if="specEntries(p.spec).length" class="spec">
                <div v-for="row in specEntries(p.spec)" :key="row.key" class="spec-row">
                  <span class="spec-k">{{ row.label }}</span>
                  <span class="spec-v">{{ row.value }}</span>
                </div>
              </div>

              <!-- 计费：包周期 / 按量 -->
              <div class="price">
                <template v-if="p.billing_mode === 1">
                  <AmountText :cents="p.price_cents" size="lg" strong />
                  <span class="unit">/ {{ p.period_days }} 天</span>
                </template>
                <template v-else>
                  <span class="metered">后付费</span>
                  <span class="unit">按量计费，开通 0 元</span>
                </template>
              </div>

              <el-button
                class="buy"
                type="primary"
                :disabled="isSoldOut(p) || isFrozen"
                @click="onBuy(p)"
              >
                {{ buyLabel(p) }}
              </el-button>
            </div>

            <!-- 补齐最后一行的空格：保持发丝线网格完整，而不是留一块空灰底 -->
            <div v-for="n in fillerCount" :key="'filler-' + n" class="card filler">
              <span v-if="n === 1">更多规格陆续接入</span>
            </div>
          </div>
        </LoadingBox>
      </Panel>
    </div>

    <SiteFooter
      statement="规格与价格实时同步自各产品；下单即开通，开通失败自动退款。"
      action-text="查看我的订单"
      action-to="/orders"
    />

    <!-- 移动端筛选抽屉 -->
    <el-drawer v-model="drawer" direction="btt" size="auto" title="按产品线筛选">
      <button
        v-for="t in tabs"
        :key="t.value"
        class="drawer-item"
        :class="{ active: productCode === t.value }"
        @click="switchTab(t.value)"
      >
        {{ t.label }}
      </button>
    </el-drawer>

    <!-- C2 下单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="确认下单"
      width="min(420px, 92vw)"
      :close-on-click-modal="false"
      @closed="onDialogClosed"
    >
      <div v-if="current" class="dlg">
        <div class="dlg-row">
          <span class="dlg-k">商品</span>
          <span class="dlg-v">{{ current.name }}</span>
        </div>
        <div class="dlg-row">
          <span class="dlg-k">单价</span>
          <span class="dlg-v">
            <template v-if="current.billing_mode === 1">
              <AmountText :cents="current.price_cents" /> / {{ current.period_days }} 天
            </template>
            <template v-else>后付费（本次开通 0 元）</template>
          </span>
        </div>
        <div class="dlg-row">
          <span class="dlg-k">数量</span>
          <span class="dlg-v">
            <el-input-number v-model="qty" :min="1" :max="maxQty" size="small" />
          </span>
        </div>
        <div class="dlg-row total">
          <span class="dlg-k">合计</span>
          <AmountText :cents="totalCents" size="lg" strong />
        </div>
        <p v-if="current.product_code === 'phone'" class="dlg-tip warn">
          云手机单项最多购买 3 台
        </p>
        <p class="dlg-tip">
          价格由后端按当前价重算，以订单为准；提交后将从钱包余额扣费，开通是异步的。
        </p>
      </div>
      <template #footer>
        <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitOrder">确认下单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
// ElMessage / ElMessageBox 由 unplugin-auto-import 按需注入（见 vite.config.js）
import { api } from '../api'
import { useUserStore } from '../store'
import { formatCents, formatTime } from '../utils/format'
import { productLineName, PRODUCT_LINE } from '../utils/constants'
import { errorList, errorText } from '../utils/errors'
import { useIsMobile } from '../utils/breakpoint'
import { AmountText, EmptyState, LoadingBox, PageBand, Panel, KpiRow, SiteFooter } from '../components'

// 规格字段的展示名/单位：只影响"好不好看"，未知 key 会原样显示，不影响兼容
const SPEC_LABEL = {
  quota_gb: '容量', region: '地域', transfer: '流量', note: '说明',
  vcpu: 'CPU', ram_gb: '内存', storage_gb: '存储', ip: '网络',
  disk_gb: '系统盘', os: '系统'
}
const SPEC_UNIT = { quota_gb: 'GB', ram_gb: 'GB', storage_gb: 'GB', disk_gb: 'GB', vcpu: '核' }

export default {
  name: 'ProductsView',
  components: { AmountText, EmptyState, LoadingBox, PageBand, Panel, KpiRow, SiteFooter },
  setup() {
    const isMobile = useIsMobile()
    return { isMobile }
  },
  data() {
    return {
      list: [],
      loading: true,
      error: false,
      // 竞态保护用：每次 load 自增，只认最后一次请求的结果
      loadSeq: 0,
      errMsg: '商品加载失败，请稍后重试',
      productCode: '', // '' = 全部
      drawer: false,
      // ── C2 下单弹窗 ──
      dialogVisible: false,
      current: null, // 当前选中的商品
      qty: 1,
      submitting: false,
      // 产品线筛选 tab 从 PRODUCT_LINE 派生，不在页面里另抄一份文案
      tabs: [
        { value: '', label: '全部' },
        ...Object.entries(PRODUCT_LINE).map(([value, label]) => ({ value, label }))
      ]
    }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'balance', 'isFrozen']),
    loggedIn() {
      return !!this.user
    },
    balanceCents() {
      return this.balance ? this.balance.balance_cents : null
    },
    lineCount() {
      return new Set(this.list.map(p => p.product_code)).size
    },
    /** 补齐最后一行：列数随断点变化（>768 三列 / ≤768 两列），让网格不留空格 */
    fillerCount() {
      const cols = this.isMobile ? 2 : 3
      const n = this.list.length
      if (!n) return 0
      return (cols - (n % cols)) % cols
    },
    /** 页头带下方指标：全部取自当前目录响应，口径写在标签里 */
    kpis() {
      // 取最新的 synced_at 原始字符串（ISO 串可直接按字典序比较，避免多余的 Date 往返）
      const latest = this.list.reduce((max, p) => (p.synced_at && p.synced_at > max ? p.synced_at : max), '')
      return [
        { label: '在售 SKU', value: String(this.list.length), unit: '个' },
        { label: '可下单产品线', value: String(this.lineCount), unit: '条' },
        { label: '账户余额', value: this.balanceCents == null ? '-' : formatCents(this.balanceCents) },
        { label: '最近目录同步', value: latest ? formatTime(latest) : '-' }
      ]
    },
    lineFilterLabel() {
      const hit = this.tabs.find(t => t.value === this.productCode)
      return hit ? hit.label : '全部'
    },
    // 单项数量上限：默认 1~10；云手机最多 3；有库存时不超过库存
    maxQty() {
      const p = this.current
      if (!p) return 1
      let m = p.product_code === 'phone' ? 3 : 10
      const stock = Number(p.stock)
      if (p.stock !== null && p.stock !== undefined && p.stock !== '' && !Number.isNaN(stock)) {
        m = Math.min(m, Math.max(1, stock))
      }
      return m
    },
    // 下单弹窗的合计（整数分，全程不经过浮点）
    // 注意语义差别：商品目录 /shop/products 的 price_cents 是「单价」，
    // 而订单项 /shop/orders/{id} 的 price_cents 是「该项小计」（已含数量），两者不要混用。
    totalCents() {
      return this.current ? this.current.price_cents * this.qty : 0
    }
  },
  created() {
    // 首页产品卡会带 ?product_code=storage 过来，直接定位到该产品线
    const q = this.$route.query.product_code
    if (q && this.tabs.some(t => t.value === q)) this.productCode = q
    this.load()
  },
  methods: {
    ...mapActions(useUserStore, ['refreshBalance']),
    async load() {
      // 竞态保护：快速切产品线会并发多个请求，先发的若后返回会覆盖新数据
      const seq = ++this.loadSeq
      this.loading = true
      this.error = false
      try {
        const params = this.productCode ? { product_code: this.productCode } : {}
        const data = await api.getProducts(params)
        if (seq !== this.loadSeq) return
        this.list = (data && data.list) || []
      } catch (e) {
        if (seq !== this.loadSeq) return
        this.error = true
        this.list = []
        this.errMsg = errorText(e) || '商品加载失败，请稍后重试'
      } finally {
        if (seq === this.loadSeq) this.loading = false
      }
    },
    switchTab(value) {
      this.drawer = false
      if (this.productCode === value) return
      this.productCode = value
      this.load()
    },
    lineName(code) {
      return productLineName(code)
    },
    isSoldOut(p) {
      // stock 可能是 null（不限/未上报）、数字或字符串数字；只有明确为 0 才算售罄
      return p.stock !== null && p.stock !== undefined && Number(p.stock) === 0
    },
    // stock 有值（含字符串数字）才算"已知库存"，否则按「现货」展示
    isStockKnown(p) {
      return p.stock !== null && p.stock !== undefined && p.stock !== '' && !Number.isNaN(Number(p.stock))
    },
    buyLabel(p) {
      if (this.isFrozen) return '钱包已冻结'
      return this.isSoldOut(p) ? '已售罄' : '立即购买'
    },
    // 把后端自定的 spec 对象转成可渲染的行；未知 key 也照常显示
    specEntries(spec) {
      if (!spec || typeof spec !== 'object') return []
      return Object.entries(spec).map(([key, value]) => ({
        key,
        label: SPEC_LABEL[key] || key,
        value: SPEC_UNIT[key] ? `${value} ${SPEC_UNIT[key]}` : String(value)
      }))
    },
    onBuy(p) {
      // 钱包冻结时不给任何下单入口（文档要求：冻结态禁用所有支付入口）
      if (this.isFrozen) {
        ElMessage.warning('钱包已冻结，请联系平台解冻后再下单')
        return
      }
      // 商品页游客可看：点购买时才要求登录，登录后回到本页
      if (!this.loggedIn) {
        ElMessageBox.confirm('购买商品需要先登录，是否现在去登录？', '需要登录', {
          confirmButtonText: '去登录',
          cancelButtonText: '再看看',
          type: 'info'
        })
          .then(() => {
            this.$router.push({ name: 'login', query: { redirect: this.$route.fullPath } })
          })
          .catch(() => {})
        return
      }
      this.openBuyDialog(p)
    },

    openBuyDialog(p) {
      this.current = p
      this.qty = 1
      this.dialogVisible = true
    },
    onDialogClosed() {
      this.current = null
      this.qty = 1
    },

    // 提交订单：★ 入参不带任何价格字段，后端按当前价重算
    async submitOrder() {
      if (this.submitting || !this.current) return // 防重复提交
      if (this.isFrozen) {
        ElMessage.warning('钱包已冻结，请联系平台解冻后再下单')
        return
      }
      const p = this.current
      this.submitting = true
      try {
        const order = await api.createOrder([
          { product_code: p.product_code, sku_id: p.sku_id, quantity: this.qty }
        ])
        this.dialogVisible = false
        ElMessage.success(`下单成功，订单号 ${order.order_no}`)
        this.$router.push({ name: 'order-detail', params: { id: order.order_id } })
      } catch (e) {
        this.handleOrderError(e)
      } finally {
        this.submitting = false
      }
    },

    // 下单错误统一处置（文案走 utils/errors，不在这里另抄一份）
    handleOrderError(e) {
      const code = e && e.code
      // 1001：data.errors 是「字符串数组」，逐条展示
      if (code === 1001) {
        const errs = errorList(e)
        if (errs.length) {
          errs.forEach(m => ElMessage.warning(m))
          return
        }
      }
      if (code === 3001) {
        ElMessageBox.confirm('钱包余额不足，是否去充值？', '余额不足', {
          confirmButtonText: '去充值',
          cancelButtonText: '再想想',
          type: 'warning'
        })
          .then(() => this.$router.push('/wallet/recharge'))
          .catch(() => {})
        return
      }
      if (code === 4002) { ElMessage.info('订单正在处理中，请勿重复提交'); return }
      if (code === 4003) { ElMessage.warning('商品已下架，正在刷新列表'); this.load(); return }
      if (code === 4004) { ElMessage.warning('库存不足，请减少数量或稍后再试'); this.load(); return }
      if (code === 3002) {
        ElMessage.warning('钱包已冻结，请联系平台解冻后再试')
        this.refreshBalance() // 同步冻结态到页头
        return
      }
      if (code === 1002) {
        ElMessage.warning('登录已过期，请重新登录')
        this.$router.push({ name: 'login', query: { redirect: this.$route.fullPath } })
        return
      }
      ElMessage.error(errorText(e) || '下单失败，请稍后重试')
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

/* 产品线筛选（放在面板头的动作槽里） */
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

/* 移动端筛选：面板头里一个筛选按钮 + 底部抽屉 */
.filter-btn {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

/* 商品网格（A 方案）：靠 1px 发丝线分隔，不用卡片投影；
   外层已经是 Panel，所以这里不再画边框与圆角 */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--line);
}
.card {
  display: flex;
  flex-direction: column;
  padding: 32px 28px;
  background: var(--bg-0);
  border: 0;
  border-radius: 0;
  transition: background 0.2s;
}
.card:hover {
  background: var(--bg-hover);
}
.card.soldout {
  background: var(--bg-1);
}
/* 补齐用的占位格：浅底 + 极轻提示，不做成"第二张商品卡" */
.card.filler {
  align-items: center;
  justify-content: center;
  background: var(--bg-1);
  color: var(--ink-4);
  font-size: var(--font-sm);
  min-height: 180px;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--s-2);
}
.line {
  font-size: var(--font-xs);
  color: var(--ink-3);
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.stock {
  font-size: var(--font-xs);
  white-space: nowrap;
}
.stock.in {
  color: var(--ink-3);
}
.stock.out {
  color: var(--error);
}
.name {
  font-size: var(--font-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: var(--s-2);
}

/* 规格 */
.spec {
  flex: 1;
  padding: var(--s-2) 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  margin-bottom: var(--s-2);
}
.spec-row {
  display: flex;
  justify-content: space-between;
  gap: var(--s-2);
  font-size: var(--font-sm);
  padding: 2px 0;
}
.spec-k {
  color: var(--ink-3);
  flex-shrink: 0;
}
.spec-v {
  color: var(--ink);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 价格（A 方案）：数字当主角，等宽紧字距 */
.price {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap; /* 窄卡片放不下时整体换行，而不是把文字挤断 */
  gap: 6px;
  margin-top: auto;
  margin-bottom: var(--s-4);
  min-height: 34px;
}
.price :deep(.amount) {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.price .unit {
  font-size: var(--font-sm);
  color: var(--ink-3);
}
.metered {
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap; /* 后付费三个字不许拆行 */
}
/* 购买按钮：A 方案用浅色主色块（不抢视觉），hover 加深 */
.buy {
  width: 100%;
  height: 44px;
}
.buy.el-button {
  background: var(--brand-weak);
  border-color: transparent;
  color: var(--brand);
  font-weight: 600;
}
.buy.el-button:hover,
.buy.el-button:focus {
  background: var(--brand-weak-2);
  border-color: transparent;
  color: var(--brand);
}
.buy.el-button.is-disabled,
.buy.el-button.is-disabled:hover {
  background: var(--bg-2);
  color: var(--ink-4);
  border-color: transparent;
}

/* ── C2 下单弹窗 ── */
.dlg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-2) 0;
  font-size: var(--font-base);
}
.dlg-row + .dlg-row {
  border-top: 1px solid var(--line);
}
.dlg-row.total {
  padding-top: var(--s-3);
}
.dlg-k {
  color: var(--ink-3);
  flex-shrink: 0;
}
.dlg-v {
  color: var(--ink);
  text-align: right;
}
.dlg-tip {
  margin-top: var(--s-3);
  font-size: var(--font-xs);
  color: var(--ink-3);
  line-height: 1.6;
}
.dlg-tip.warn {
  color: var(--warning);
  margin-top: var(--s-2);
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--s-2);
  }
  .card {
    padding: var(--s-3);
  }
  .name {
    font-size: var(--font-base);
  }
  /* 触控目标 ≥ 44px */
  .buy {
    height: 44px;
  }
  /* 下单弹窗内的控件也不能只有 32px（EP 默认尺寸） */
  .products :deep(.el-dialog .el-input-number),
  .products :deep(.el-dialog .el-input-number__decrease),
  .products :deep(.el-dialog .el-input-number__increase) {
    min-height: 44px;
  }
  .products :deep(.el-dialog__footer .el-button) {
    min-height: 44px;
    padding: 0 20px;
  }
}
</style>