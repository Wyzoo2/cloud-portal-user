<template>
  <div class="account">
    <!-- 页头带（方案 1 结构 + 方案 3 大标题） -->
    <PageBand
      :crumb="[{ text: '首页', to: '/' }, { text: '账户' }]"
      title="账户中心"
      desc="余额、充值、流水与账户安全集中在这一页：钱包与个人设置不再各自成一个空页面。"
    >
      <template #side>
        <div class="band-stat">
          <b class="figure">{{ balanceCents == null ? '—' : formatCents(balanceCents) }}</b>
          <span>可用余额</span>
        </div>
        <div class="band-stat">
          <b class="figure">{{ frozen ? '已冻结' : '正常' }}</b>
          <span>钱包状态</span>
        </div>
      </template>
    </PageBand>

    <div class="body">
      <!-- 余额 + 快捷入口 -->
      <div class="top">
        <Panel>
          <div class="bal" v-loading="loading">
            <div class="bal-label">账户余额</div>
            <div class="bal-amount"><AmountText :cents="balanceCents" /></div>
            <div class="bal-meta">
              <span class="status" :class="{ frozen, unknown: !balance }">{{ statusText }}</span>
              <span class="hint">预充值制账户 · 余额可用于所有产品线消费</span>
            </div>
            <div v-if="frozen" class="tip danger">钱包已冻结，请联系平台解冻后再支付</div>
            <div v-else-if="balanceError" class="tip warn">
              余额加载失败，请检查网络后重试
              <el-button link type="primary" @click="reload">重新加载</el-button>
            </div>
            <div class="bal-acts">
              <el-button v-if="canRecharge" type="primary" @click="$router.push('/wallet/recharge')">去充值</el-button>
              <el-button @click="$router.push('/wallet/transactions')">消费流水</el-button>
              <el-button v-if="canRecharge" @click="$router.push('/wallet/recharges')">充值记录</el-button>
            </div>
            <div v-if="!canRecharge" class="tip">企业员工账号由企业统一充值，余额由企业管理员分配</div>
          </div>
        </Panel>

        <Panel title="常用入口">
          <button v-if="canRecharge" class="entry" @click="$router.push('/wallet/recharge')">
            <span class="e-body"><b>充值</b><small>线下转账 + 管理员核销，不是即时到账</small></span>
            <span class="e-arrow">→</span>
          </button>
          <button class="entry" @click="$router.push('/wallet/transactions')">
            <span class="e-body"><b>消费流水</b><small>每一笔进出明细，可按类型筛选</small></span>
            <span class="e-arrow">→</span>
          </button>
          <button v-if="canRecharge" class="entry" @click="$router.push('/wallet/recharges')">
            <span class="e-body"><b>充值记录</b><small>核销进度与驳回原因</small></span>
            <span class="e-arrow">→</span>
          </button>
          <button class="entry" @click="$router.push('/orders')">
            <span class="e-body"><b>我的订单</b><small>查看开通结果与退款去向</small></span>
            <span class="e-arrow">→</span>
          </button>
        </Panel>
      </div>

      <!-- 账户信息 -->
      <Panel title="账户信息" small="来自当前登录态与钱包查询">
        <div class="rows">
          <div class="row"><span>用户名</span><b>{{ username }}</b></div>
          <div class="row"><span>用户 ID</span><b class="mono">{{ userId }}</b></div>
          <div class="row"><span>钱包状态</span><b>{{ statusText }}</b></div>
          <div class="row"><span>余额查询时间</span><b>{{ balanceUpdatedAt }}</b></div>
        </div>
      </Panel>

      <!-- 账户安全 -->
      <Panel title="账户安全" small="修改密码后所有设备需重新登录">
        <div class="pwd">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
            <div class="pwd-grid">
              <el-form-item prop="old_password" label="当前密码">
                <el-input v-model="form.old_password" type="password" size="large" show-password
                  placeholder="请输入当前密码" />
              </el-form-item>
              <el-form-item prop="new_password" label="新密码">
                <el-input v-model="form.new_password" type="password" size="large" show-password
                  placeholder="8-64 位，含字母和数字" />
              </el-form-item>
              <el-form-item prop="confirm_password" label="确认新密码">
                <el-input v-model="form.confirm_password" type="password" size="large" show-password
                  placeholder="请再次输入新密码" />
              </el-form-item>
            </div>
            <div class="pwd-acts">
              <el-button type="primary" native-type="submit" :loading="saving">确认修改</el-button>
              <el-button @click="onLogout">退出登录</el-button>
              <el-alert v-if="error" class="pwd-alert" :title="error" type="error" :closable="false" show-icon />
            </div>
          </el-form>
        </div>
      </Panel>

      <!-- 最近流水 -->
      <Panel title="最近流水" small="每一笔进出明细">
        <template #actions>
          <el-button link type="primary" @click="$router.push('/wallet/transactions')">查看全部</el-button>
        </template>
        <div v-if="!recent.length" class="empty">暂无流水记录</div>
        <div v-else class="rows">
          <div v-for="t in recent" :key="t.id" class="row">
            <span>
              <StatusTag type="transaction" :value="t.type" />
              <em class="muted">{{ productLineName(t.product_code) }}</em>
            </span>
            <b :class="Number(t.type) === 1 || Number(t.type) === 3 ? 'in' : 'out'">
              {{ Number(t.type) === 1 || Number(t.type) === 3 ? '+' : '-' }}{{ formatCents(Math.abs(Number(t.amount_cents) || 0)) }}
              <em class="muted">{{ formatTime(t.created_at) }}</em>
            </b>
          </div>
        </div>
      </Panel>
    </div>

    <SiteFooter
      :statement="canRecharge
        ? '充值走线下转账 + 管理员核销，到账后即可下单开通。'
        : '企业员工账号由企业统一充值，余额与配额由企业管理员分配。'"
      :action-text="canRecharge ? '去充值' : ''"
      action-to="/wallet/recharge"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
// ElMessage 由 unplugin-auto-import 按需注入（见 vite.config.js）
import { api } from '../api'
import { useUserStore } from '../store'
import { formatCents, formatTime } from '../utils/format'
import { productLineName, WALLET_STATUS } from '../utils/constants'
import { errorText } from '../utils/errors'
import { AmountText, PageBand, Panel, StatusTag, SiteFooter } from '../components'

/** 写本地账本：配额满 / 隐私模式下 setItem 会抛，不能让它打断提示流程 */
function writeBaseline(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids))
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[到账提示] 本地账本写入失败', e)
  }
}

export default {
  name: 'AccountView',
  components: { AmountText, PageBand, Panel, StatusTag, SiteFooter },
  data() {
    return {
      loading: false,
      // 最近流水从这一份数据算，口径在页面上写清
      tx: [],
      // 到账提示用：页面卸载标志 + 请求序号（快速切页/双击重试时只认最后一次）
      destroyed: false,
      arrivedSeq: 0,
      // 重新加载的重入保护
      reloading: false,
      saving: false,
      error: '',
      form: { old_password: '', new_password: '', confirm_password: '' },
      rules: {
        old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
        new_password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { pattern: /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/, message: '新密码需 8-64 位，且同时包含字母和数字', trigger: 'blur' }
        ],
        confirm_password: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value !== this.form.new_password) callback(new Error('两次输入的密码不一致'))
              else callback()
            },
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'balance', 'balanceError', 'isFrozen', 'canRecharge']),
    frozen() {
      return this.isFrozen
    },
    username() {
      return (this.user && this.user.username) || '未登录'
    },
    userId() {
      return (this.user && this.user.id) || '-'
    },
    balanceCents() {
      return this.balance ? this.balance.balance_cents : null
    },
    statusText() {
      if (this.frozen) return WALLET_STATUS[1].text
      if (!this.balance) return '—'
      return WALLET_STATUS[0].text
    },
    balanceUpdatedAt() {
      return this.balance && this.balance.updated_at ? formatTime(this.balance.updated_at) : '-'
    },
    recent() {
      return this.tx.slice(0, 5)
    }
  },
  created() {
    this.reload()
  },
  beforeUnmount() {
    // 到账提示是 fire-and-forget：卸载后别再弹全局框（用户已经翻到别的页面了）
    this.destroyed = true
  },
  methods: {
    ...mapActions(useUserStore, ['refreshBalance', 'logout']),
    formatTime,
    formatCents,
    productLineName,
    async reload() {
      // 重入保护：连点「重新加载」会并发两次，旧响应可能盖掉新数据、还会重复弹到账提示
      if (this.reloading) return
      this.reloading = true
      this.loading = true
      try {
        await Promise.allSettled([
          this.refreshBalance(),
          // 最近流水只用于下方展示，失败不影响账户信息
          api.getTransactions({ page: 1, size: 100 })
            .then(d => { this.tx = (d && d.list) || [] })
            .catch(() => { this.tx = [] })
        ])
      } finally {
        this.loading = false
        this.reloading = false
      }
      // 余额已就绪，这时再检查有没有「刚到账」的充值并提示（不阻塞上面的展示）
      this.notifyArrivedRecharge()
    },

    /**
     * 充值到账提示：进账户页时查一次「已到账」的充值，与本地账本比对，有新到账的弹一条合并提示。
     *
     * 本地存的是一份【已提示集合】而不是"当前快照"，为的是堵住这几类误报：
     * - 首次进入（该用户还没有账本）只建立基线、不提示，否则历史到账会一次性弹一堆
     * - 基线按并集累积并封顶：单号滑出「前 100 条」后不会被误判成刚到账（否则会弹一笔虚假合计）
     * - 接口返回空列表时保持原基线不动（视作查询异常），避免下次把历史全当新到账
     * - 账本按用户 id 命名空间隔离：换账号不会把上一个账号的到账认成自己的
     * - 账本损坏（parse 失败）只重建、不提示
     * - 多笔同时到账合并成一条；卸载后不再弹框；全程静默失败，不影响账户页使用
     */
    async notifyArrivedRecharge() {
      const uid = (this.user && this.user.id) || 'anonymous'
      const KEY = `portal_arrived_recharges:${uid}`
      const MAX = 500
      const seq = ++this.arrivedSeq
      try {
        const d = await api.getRecharges({ page: 1, size: 100, status: 1 })
        // 期间又发起过一次（快速切页 / 双击重试）或页面已卸载 → 这次结果作废，避免重复弹窗
        if (seq !== this.arrivedSeq || this.destroyed) return

        const list = (d && d.list) || []
        // apply_id 缺失的行没法当唯一键（String(undefined) 会全塌成一格），跳过
        const ids = list.filter(r => r && r.apply_id != null).map(r => String(r.apply_id))

        const saved = localStorage.getItem(KEY)
        if (saved === null) {
          // 该用户首次进页面：只建立基线，不打扰
          writeBaseline(KEY, ids)
          return
        }

        let known = null
        try { known = JSON.parse(saved) } catch (e) { known = null }
        if (!Array.isArray(known)) {
          // 账本损坏：重建基线，绝不当成"全是新的"
          writeBaseline(KEY, ids)
          return
        }

        if (!ids.length) {
          // 有账本却一条已到账都查不到 → 视为查询异常，保持基线不动
          if (known.length) return
          writeBaseline(KEY, [])
          return
        }

        const knownSet = new Set(known.map(String))
        const fresh = list.filter(r => r.apply_id != null && !knownSet.has(String(r.apply_id)))

        // 基线取并集并封顶：老单号不会被遗忘，也就不会被误判成新到账
        writeBaseline(KEY, Array.from(new Set([...known, ...ids])).slice(-MAX))
        if (!fresh.length) return

        const total = fresh.reduce((s, r) => s + (Number(r.amount_cents) || 0), 0)
        const what = fresh.length === 1
          ? `充值 ${formatCents(fresh[0].amount_cents)} 已到账`
          : `${fresh.length} 笔充值已到账，合计 ${formatCents(total)}`
        // 后端已经给了权威的「到账后余额」，优先用它；取不到再退回页面余额
        const after = fresh.reduce((max, r) => Math.max(max, Number(r.balance_after) || 0), 0)
        const cents = after || this.balanceCents
        const bal = cents == null ? '' : `，当前余额 ${formatCents(cents)}`

        ElMessageBox.alert(what + bal, '充值已到账', {
          confirmButtonText: '知道了',
          type: 'success'
        }).catch(() => {})
      } catch (e) {
        // 静默：查不到就不提示，不影响账户页正常使用（dev 下留个痕，便于排查）
        if (import.meta.env.DEV) console.warn('[到账提示] 已跳过', e)
      }
    },
    onLogout() {
      this.logout()
      this.$router.push('/login')
    },
    async onSubmit() {
      // 防重复提交：validate() 是异步的，等它返回再置 saving 会留下空窗期，
      // 用户快速双击会发两次改密请求 —— 守卫和 saving 必须放在最前面
      if (this.saving) return
      this.saving = true
      try {
        const valid = await this.$refs.formRef.validate().catch(() => false)
        if (!valid) return
        this.error = ''
        await api.changePassword(this.form.old_password, this.form.new_password)
        ElMessage.success('密码修改成功，请重新登录')
        this.logout()
        this.$router.push('/login')
      } catch (e) {
        // 改密场景 2003 = 当前密码错误（区别于登录的"账号或密码错误"）
        this.error = Number(e && e.code) === 2003 ? '当前密码错误' : errorText(e)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
/* 页头带右侧的关键数字（在深色底上，用白字） */
.side {
  display: flex;
  align-items: flex-end;
  gap: 28px;
  flex-shrink: 0;
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
.top {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: var(--s-5);
  align-items: start;
}
/* 余额：A 方案的"数字当主角" */
.bal {
  padding: 32px 28px;
}
.bal-label {
  font-size: 13px;
  color: var(--ink-3);
}
.bal-amount {
  margin-top: 8px;
}
.bal-amount :deep(.amount) {
  font-size: 56px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.bal-meta {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.status {
  font-size: 12px;
  font-weight: 600;
  color: var(--success);
  background: var(--success-bg);
  padding: 3px 11px;
  border-radius: var(--r-pill);
  white-space: nowrap;
  flex-shrink: 0;
}
.status.frozen {
  color: var(--danger);
  background: var(--danger-bg);
}
.status.unknown {
  color: var(--ink-3);
  background: var(--bg-2);
}
.hint {
  font-size: 13px;
  color: var(--ink-3);
}
.tip {
  margin-top: 16px;
  font-size: 13px;
  padding: 12px 16px;
  border-radius: var(--r-sm);
}
.tip.danger {
  color: var(--danger);
  background: var(--danger-bg);
}
.tip.warn {
  color: var(--warning);
  background: var(--warning-bg);
}
.bal-acts {
  margin-top: 22px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 快捷入口：发丝线列表 */
.entry {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px var(--s-6);
  border: 0;
  border-bottom: 1px solid var(--line);
  background: var(--bg-0);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}
.entry:last-child {
  border-bottom: 0;
}
.entry:hover {
  background: var(--bg-hover);
}
.e-body b {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.e-body small {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: var(--ink-3);
}
.e-arrow {
  color: var(--ink-4);
}

/* 键值行 */
.rows {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px var(--s-6);
  border-bottom: 1px solid var(--line);
  font-size: 14px;
}
.rows .row:last-child {
  border-bottom: 0;
}
.row > span {
  color: var(--ink-3);
  display: flex;
  align-items: center;
  gap: 10px;
}
.row b {
  font-weight: 600;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 12px;
}
.row b.in {
  color: var(--success);
}
.row b.out {
  color: var(--danger);
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
}
.muted {
  font-style: normal;
  font-size: 12px;
  color: var(--ink-3);
  font-weight: 400;
}
.empty {
  padding: 28px var(--s-6);
  font-size: 13px;
  color: var(--ink-3);
}

/* 改密表单 */
.pwd {
  padding: 22px var(--s-6);
}
.pwd-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 var(--s-5);
}
.pwd-acts {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.pwd-alert {
  width: 100%;
}

@media (max-width: 1000px) {
  .top {
    grid-template-columns: 1fr;
  }
  .pwd-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .body {
    padding: var(--s-4) var(--s-3) var(--s-10);
  }
  .bal-amount :deep(.amount) {
    font-size: 40px;
  }
}
</style>
