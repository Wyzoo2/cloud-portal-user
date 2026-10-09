<template>
  <div class="layout">
    <!-- 顶栏 -->
    <header class="header">
      <div class="brand" @click="$router.push('/')">云平台统一门户</div>

      <!-- PC 导航 -->
      <nav class="nav">
        <router-link v-for="m in menu" :key="m.path" :to="m.path" class="nav-item"
          :class="{ active: isActive(m.path) }">{{ m.label }}</router-link>
      </nav>

      <div class="right">
        <div class="balance" @click="$router.push('/wallet')">
          余额 <AmountText :cents="balanceCents" strong />
        </div>
        <el-dropdown @command="onCommand">
          <span class="user">{{ username }}</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">我的</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="content">
      <router-view />
    </main>

    <!-- 移动端底部 Tab -->
    <nav class="tabbar">
      <router-link v-for="m in menu" :key="m.path" :to="m.path" class="tab-item"
        :class="{ active: isActive(m.path) }">
        <span class="tab-label">{{ m.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useUserStore } from '../store'
import AmountText from './AmountText.vue'
import { APP_MENU } from '../utils/constants'

export default {
  name: 'AppLayout',
  components: { AmountText },
  data() {
    return { menu: APP_MENU }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'balance']),
    username() {
      return (this.user && this.user.username) || '未登录'
    },
    balanceCents() {
      return this.balance ? this.balance.balance_cents : null
    }
  },
  created() {
    this.refreshBalance()
  },
  methods: {
    ...mapActions(useUserStore, ['logout', 'refreshBalance']),
    isActive(path) {
      const p = this.$route.path
      return p === path || (path !== '/' && p.startsWith(path + '/'))
    },
    onCommand(cmd) {
      if (cmd === 'logout') {
        this.logout()
        this.$router.push('/login')
      } else if (cmd === 'profile') {
        this.$router.push('/profile')
      }
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  height: 56px;
  padding: 0 var(--space-lg);
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
}
.brand {
  font-weight: 700;
  font-size: var(--font-md);
  color: var(--accent);
  cursor: pointer;
  white-space: nowrap;
}
.nav {
  display: flex;
  gap: var(--space-xs);
  flex: 1;
}
.nav-item {
  padding: 6px 12px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  transition: color 0.2s;
}
.nav-item:hover {
  color: var(--text-primary);
}
.nav-item.active {
  color: var(--accent);
  font-weight: 600;
}
.right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.balance {
  cursor: pointer;
  font-size: var(--font-base);
  color: var(--text-secondary);
  white-space: nowrap;
}
.user {
  cursor: pointer;
  font-size: var(--font-base);
  color: var(--text-primary);
}
.content {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--space-lg);
}
.tabbar {
  display: none;
}

@media (max-width: 768px) {
  .header {
    gap: var(--space-sm);
    height: 48px;
    padding: 0 var(--space);
  }
  .brand {
    font-size: var(--font-md);
  }
  .nav {
    display: none;
  }
  .right {
    margin-left: auto;
    gap: var(--space-sm);
  }
  .content {
    padding: var(--space) var(--space) calc(72px + var(--safe-bottom));
  }
  .tabbar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    height: 56px;
    padding-bottom: var(--safe-bottom);
    background: var(--bg-card);
    border-top: 1px solid var(--divider);
  }
  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-sm);
    color: var(--text-secondary);
  }
  .tab-item.active {
    color: var(--accent);
    font-weight: 600;
  }
}
</style>
