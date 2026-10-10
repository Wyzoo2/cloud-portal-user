<template>
  <div class="wallet">
    <!-- 余额卡片 -->
    <div class="bal-card" v-loading="loading" v-reveal>
      <div class="bal-label">账户余额</div>
      <div class="bal-amount">
        <AmountText :cents="balanceCents" />
      </div>
      <div class="bal-meta">
        <span class="status" :class="{ frozen }">{{ frozen ? '已冻结' : '正常' }}</span>
        <span class="hint">预充值制账户 · 余额可用于所有产品线消费</span>
      </div>
      <div v-if="frozen" class="frozen-tip">⚠️ 钱包已冻结，请联系平台解冻后再支付</div>
    </div>

    <!-- 入口 -->
    <div class="entries">
      <div class="entry" v-reveal="{ delay: 0 }" @click="$router.push('/wallet/recharge')">
        <span class="e-ic">💰</span>
        <div class="e-body"><b>充值</b><small>线下转账 + 管理员核销</small></div>
        <span class="e-arrow">→</span>
      </div>
      <div class="entry" v-reveal="{ delay: 100 }" @click="$router.push('/wallet/transactions')">
        <span class="e-ic">📋</span>
        <div class="e-body"><b>消费流水</b><small>每一笔进出明细</small></div>
        <span class="e-arrow">→</span>
      </div>
      <div class="entry" v-reveal="{ delay: 200 }" @click="$router.push('/wallet/recharges')">
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
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 44px 40px;
  box-shadow: var(--shadow-sm);
}
.bal-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.bal-amount :deep(.amount) {
  font-size: 52px;
  font-weight: 600;
  letter-spacing: -1px;
  color: var(--text-primary);
}
.bal-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.status {
  font-size: 13px;
  font-weight: 600;
  color: var(--success);
  background: rgba(0, 181, 120, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}
.status.frozen {
  color: var(--error);
  background: rgba(245, 63, 63, 0.1);
}
.hint {
  font-size: 13px;
  color: var(--text-secondary);
}
.frozen-tip {
  margin-top: 16px;
  font-size: 13px;
  color: var(--error);
  background: rgba(245, 63, 63, 0.06);
  padding: 12px 16px;
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
  gap: 14px;
  padding: 22px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: 0.25s;
  box-shadow: var(--shadow-sm);
}
.entry:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}
.e-ic {
  font-size: 28px;
}
.e-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.e-body b {
  font-size: 15px;
  font-weight: 600;
}
.e-body small {
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 3px;
}
.e-arrow {
  color: var(--text-disabled);
  font-size: 18px;
  transition: 0.2s;
}
.entry:hover .e-arrow {
  color: var(--accent);
  transform: translateX(3px);
}
@media (max-width: 768px) {
  .entries {
    grid-template-columns: 1fr;
  }
  .bal-card {
    padding: 32px 24px;
  }
  .bal-amount :deep(.amount) {
    font-size: 40px;
  }
}
</style>
