<template>
  <div class="products">
    <!-- 页头 -->
    <div class="page-head">
      <h2>商品中心</h2>
      <p class="sub">价格为目录缓存价（10 分钟级同步），最终以下单时价格为准</p>
    </div>

    <!-- 产品线筛选 -->
    <div class="tabs">
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

    <LoadingBox :loading="loading" :rows="6">
      <!-- 出错 -->
      <EmptyState v-if="error" :description="errMsg">
        <el-button type="primary" @click="load">重新加载</el-button>
      </EmptyState>

      <!-- 空态 -->
      <EmptyState v-else-if="!list.length" description="该产品线暂时没有可售商品" />

      <!-- 商品卡片 -->
      <div v-else class="grid">
        <div
          v-for="p in list"
          :key="p.product_code + '/' + p.sku_id"
          class="card"
          :class="{ soldout: isSoldOut(p) }"
        >
          <div class="card-top">
            <span class="line">{{ lineName(p.product_code) }}</span>
            <!-- 库存三态：null=现货 / 数字=剩 N / 0=售罄 -->
            <span v-if="isSoldOut(p)" class="stock out">已售罄</span>
            <span v-else-if="p.stock === null" class="stock in">现货</span>
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
            :disabled="isSoldOut(p)"
            @click="onBuy(p)"
          >
            {{ isSoldOut(p) ? '已售罄' : '立即购买' }}
          </el-button>
        </div>
      </div>
    </LoadingBox>

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
import { mapState } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'
import { useUserStore } from '../store'
import { AmountText, EmptyState, LoadingBox } from '../components'

// 规格字段的展示名/单位：只影响"好不好看"，未知 key 会原样显示，不影响兼容
const SPEC_LABEL = {
  quota_gb: '容量', region: '地域', transfer: '流量', note: '说明',
  vcpu: 'CPU', ram_gb: '内存', storage_gb: '存储', ip: '网络',
  disk_gb: '系统盘', os: '系统'
}
const SPEC_UNIT = { quota_gb: 'GB', ram_gb: 'GB', storage_gb: 'GB', disk_gb: 'GB', vcpu: '核' }

const LINE_NAME = { storage: '云存储', phone: '云手机', desktop: '云电脑' }

export default {
  name: 'ProductsView',
  components: { AmountText, EmptyState, LoadingBox },
  data() {
    return {
      list: [],
      loading: true,
      error: false,
      errMsg: '商品加载失败，请稍后重试',
      productCode: '', // '' = 全部
      // ── C2 下单弹窗 ──
      dialogVisible: false,
      current: null, // 当前选中的商品
      qty: 1,
      submitting: false,
      tabs: [
        { value: '', label: '全部' },
        { value: 'storage', label: '云存储' },
        { value: 'phone', label: '云手机' },
        { value: 'desktop', label: '云电脑' }
      ]
    }
  },
  computed: {
    ...mapState(useUserStore, ['user']),
    loggedIn() {
      return !!this.user
    },
    // 单项数量上限：默认 1~10；云手机最多 3；有库存时不超过库存
    maxQty() {
      const p = this.current
      if (!p) return 1
      let m = p.product_code === 'phone' ? 3 : 10
      if (typeof p.stock === 'number') m = Math.min(m, Math.max(1, p.stock))
      return m
    },
    // 合计（整数分，全程不经过浮点）
    totalCents() {
      return this.current ? this.current.price_cents * this.qty : 0
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
        const params = this.productCode ? { product_code: this.productCode } : {}
        const data = await api.getProducts(params)
        this.list = (data && data.list) || []
      } catch (e) {
        this.error = true
        this.list = []
        this.errMsg = this.readableError(e)
      } finally {
        this.loading = false
      }
    },
    switchTab(value) {
      if (this.productCode === value) return
      this.productCode = value
      this.load()
    },
    // 错误一律转成中文人话，绝不出现"未知错误"
    readableError(e) {
      if (!e) return '商品加载失败，请稍后重试'
      // 1001 的 data.errors 是「字符串数组」，逐条拼起来
      if (e.data && Array.isArray(e.data.errors) && e.data.errors.length) {
        return e.data.errors.join('；')
      }
      return e.message || '商品加载失败，请稍后重试'
    },
    lineName(code) {
      return LINE_NAME[code] || code
    },
    isSoldOut(p) {
      return p.stock === 0
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

    // 下单错误统一处置（对照文档 §3.4 错误码表）
    handleOrderError(e) {
      const code = e && e.code
      // 1001：data.errors 是「字符串数组」，必须逐条展示
      if (code === 1001) {
        const errs = e.data && Array.isArray(e.data.errors) ? e.data.errors : []
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
      if (code === 1002) {
        ElMessage.warning('登录已过期，请重新登录')
        this.$router.push({ name: 'login', query: { redirect: this.$route.fullPath } })
        return
      }
      ElMessage.error((e && e.message) || '下单失败，请稍后重试')
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

/* 产品线筛选 */
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

/* 商品卡片网格：PC 三列 / 移动端两列 */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}
.card {
  display: flex;
  flex-direction: column;
  padding: var(--space-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: box-shadow 0.2s, transform 0.2s;
}
.card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}
.card.soldout {
  opacity: 0.65;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}
.line {
  font-size: var(--font-xs);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 1px 7px;
  white-space: nowrap;
}
.stock {
  font-size: var(--font-xs);
  white-space: nowrap;
}
.stock.in {
  color: var(--success);
}
.stock.out {
  color: var(--error);
}
.name {
  font-size: var(--font-md);
  margin-bottom: var(--space-sm);
}

/* 规格 */
.spec {
  flex: 1;
  padding: var(--space-sm) 0;
  border-top: 1px dashed var(--divider);
  border-bottom: 1px dashed var(--divider);
  margin-bottom: var(--space-sm);
}
.spec-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  font-size: var(--font-sm);
  padding: 2px 0;
}
.spec-k {
  color: var(--text-secondary);
  flex-shrink: 0;
}
.spec-v {
  color: var(--text-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 价格 */
.price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: var(--space);
  min-height: 30px;
}
.price .unit {
  font-size: var(--font-xs);
  color: var(--text-secondary);
}
.metered {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--accent);
}
.buy {
  width: 100%;
}

/* ── C2 下单弹窗 ── */
.dlg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  font-size: var(--font-base);
}
.dlg-row + .dlg-row {
  border-top: 1px dashed var(--divider);
}
.dlg-row.total {
  padding-top: var(--space);
}
.dlg-k {
  color: var(--text-secondary);
  flex-shrink: 0;
}
.dlg-v {
  color: var(--text-primary);
  text-align: right;
}
.dlg-tip {
  margin-top: var(--space);
  font-size: var(--font-xs);
  color: var(--text-secondary);
  line-height: 1.6;
}
.dlg-tip.warn {
  color: var(--warning);
  margin-top: var(--space-sm);
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }
  .card {
    padding: var(--space);
  }
  .name {
    font-size: var(--font-base);
  }
  /* 触控目标 ≥ 44px */
  .buy {
    height: 44px;
  }
}
</style>
