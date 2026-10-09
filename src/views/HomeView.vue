<template>
  <div class="home">
    <el-card shadow="never">
      <h2 class="hi">你好，{{ username }}</h2>
      <p class="balance">当前余额 <AmountText :cents="balanceCents" size="lg" strong /></p>
    </el-card>

    <div class="grid">
      <el-card v-for="m in menu" :key="m.path" class="cell" shadow="hover" @click="$router.push(m.path)">
        <div class="cell-label">{{ m.label }}</div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useUserStore } from '../store'
import AmountText from '../components/AmountText.vue'
import { APP_MENU } from '../utils/constants'

export default {
  name: 'HomeView',
  components: { AmountText },
  data() {
    return { menu: APP_MENU }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'balance']),
    username() {
      return (this.user && this.user.username) || '朋友'
    },
    balanceCents() {
      return this.balance ? this.balance.balance_cents : null
    }
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.hi {
  margin: 0 0 var(--space-sm);
  font-size: var(--font-lg);
}
.balance {
  margin: 0;
  color: var(--text-secondary);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space);
}
.cell {
  cursor: pointer;
}
.cell-label {
  text-align: center;
  font-size: var(--font-md);
}
</style>
