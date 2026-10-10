<template>
  <div class="wallet">
    <!-- 余额卡片 -->
    <div class="bal-card" v-loading="loading">
      <div class="bal-top">
        <span class="bal-label">账户余额</span>
        <el-tag :type="frozen ? 'danger' : 'success'" size="small" effect="light">
          {{ frozen ? '已冻结' : '正常' }}
        </el-tag>
      </div>
      <div class="bal-amount">
        <AmountText :cents="balanceCents" />
      </div>
      <div v-if="frozen" class="frozen-tip">⚠️ 钱包已冻结，请联系平台解冻后再支付</div>
      <div v-else class="bal-hint">预充值制账户 · 余额可用于所有产品线消费</div>
    </div>

    <!-- 入口 -->
    <div class="entries">
      <div class="entry" @click="$router.push('/wallet/recharge')">
        <span class="e-ic">💰</span>
        <div class="e-body"><b>充值</b><small>线下转账 + 管理员核销</small></div>
        <span class="e-arrow">→</span>
      </div>
      <div class="entry" @click="$router.push('/wallet/transactions')">
        <span class="e-ic">📋</span>
        <div class="e-body"><b>消费流水</b><small>每一笔进出明细</small></div>
        <span class="e-arrow">→</span>
      </div>
      <div class="entry" @click="$router.push('/wallet/recharges')">
        <span class="e-ic">🧾</span>
        <div class="e-body"><b>充值记录</b><small>核销进度与驳回原因</small></div>
        <span class="e-arrow">→</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useUserStore } from '../store'
import { AmountText } from '../components'

export default {
  name: 'WalletView',
  components: { AmountText },
  data() {
    return { loading: false }
  },
  computed: {
    ...mapState(useUserStore, ['balance']),
    balanceCents() {
      return this.balance ? this.balance.balance_cents : null
    },
    frozen() {
      return !!(this.balance && this.balance.status === 1)
    }
  },
  created() {
    this.loading = true
    this.refreshBalance().finally(() => {
      this.loading = false
    })
  },
  methods: {
    ...mapActions(useUserStore, ['refreshBalance'])
  }
}
</script>

<style scoped>
.wallet {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}
.bal-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  padding: 32px;
  color: #fff;
  background:
    radial-gradient(600px 300px at 90% -20%, rgba(0, 212, 255, 0.35), transparent),
    var(--accent-gradient);
  box-shadow: var(--shadow-lg);
}
.bal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.bal-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}
.bal-amount :deep(.amount) {
  font-size: 46px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
}
.bal-hint {
  margin-top: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
}
.frozen-tip {
  margin-top: 12px;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.22);
  padding: 10px 14px;
  border-radius: 10px;
}
.entries {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space);
}
.entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: 0.2s;
}
.entry:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
  border-color: transparent;
}
.e-ic {
  font-size: 26px;
}
.e-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.e-body b {
  font-size: 15px;
}
.e-body small {
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 2px;
}
.e-arrow {
  color: var(--text-secondary);
  font-size: 18px;
}
@media (max-width: 768px) {
  .entries {
    grid-template-columns: 1fr;
  }
  .bal-card {
    padding: 24px;
  }
  .bal-amount :deep(.amount) {
    font-size: 36px;
  }
}
</style>
