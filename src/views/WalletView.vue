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
      <div v-if="frozen" class="frozen-tip">钱包已冻结，请联系平台解冻后再支付</div>
    </div>

    <!-- 入口 -->
    <div class="entries">
      <div class="entry" v-reveal="{ delay: 0 }" @click="$router.push('/wallet/recharge')">
        <span class="e-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        </span>
        <div class="e-body"><b>充值</b><small>线下转账 + 管理员核销</small></div>
        <span class="e-arrow">→</span>
      </div>
      <div class="entry" v-reveal="{ delay: 100 }" @click="$router.push('/wallet/transactions')">
        <span class="e-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M3 6h.01" />
            <path d="M8 12h13" /><path d="M8 18h13" /><path d="M8 6h13" />
          </svg>
        </span>
        <div class="e-body"><b>消费流水</b><small>每一笔进出明细</small></div>
        <span class="e-arrow">→</span>
      </div>
      <div class="entry" v-reveal="{ delay: 200 }" @click="$router.push('/wallet/recharges')">
        <span class="e-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
          </svg>
        </span>
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
  gap: var(--s-6);
}
.bal-card {
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 44px 40px;
  box-shadow: var(--sh-1);
}
.bal-label {
  font-size: 14px;
  color: var(--ink-3);
  margin-bottom: 8px;
}
.bal-amount :deep(.amount) {
  font-size: 52px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.bal-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.status {
  font-size: 12px;
  font-weight: 600;
  color: var(--success);
  background: var(--success-bg);
  padding: 3px 11px;
  border-radius: var(--r-pill);
}
.status.frozen {
  color: var(--danger);
  background: var(--danger-bg);
}
.hint {
  font-size: 13px;
  color: var(--ink-3);
}
.frozen-tip {
  margin-top: 16px;
  font-size: 13px;
  color: var(--danger);
  background: var(--danger-bg);
  padding: 12px 16px;
  border-radius: var(--r-sm);
}
.entries {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-4);
}
.entry {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 20px;
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: 0.22s cubic-bezier(0.22, 0.61, 0.36, 1);
  box-shadow: var(--sh-1);
}
.entry:hover {
  transform: translateY(-4px);
  box-shadow: var(--sh-2);
}
.e-ic {
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  background: var(--brand-weak);
  color: var(--brand);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.e-ic svg {
  width: 22px;
  height: 22px;
}
.e-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.e-body b {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}
.e-body small {
  color: var(--ink-3);
  font-size: 12px;
  margin-top: 3px;
}
.e-arrow {
  color: var(--ink-4);
  font-size: 18px;
  transition: 0.2s;
}
.entry:hover .e-arrow {
  color: var(--brand);
  transform: translateX(3px);
}
@media (max-width: 1000px) {
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
