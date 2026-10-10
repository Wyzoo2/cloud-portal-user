<template>
  <div class="layout">
    <!-- 顶栏 -->
    <header class="header">
      <div class="brand" @click="$router.push('/')">
        <span class="mark">☁</span>
        <div class="brand-text">
          <b>云平台统一门户</b>
          <small>CLOUD PORTAL</small>
        </div>
      </div>

      <!-- PC 导航 -->
      <nav class="nav">
        <router-link v-for="m in menu" :key="m.path" :to="m.path" class="nav-item"
          :class="{ active: isActive(m.path) }">{{ m.label }}</router-link>
      </nav>

      <div class="right">
        <!-- 已登录：余额 + 用户下拉 -->
        <template v-if="isLoggedIn">
          <div class="balance" @click="$router.push('/wallet')">
            余额 <AmountText :cents="balanceCents" strong />
          </div>
          <el-dropdown @command="onCommand">
            <span class="user">
              <span class="avatar">{{ avatarText }}</span>{{ username }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">我的</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <!-- 游客：登录 / 注册 -->
        <template v-else>
          <button class="btn-nav ghost" @click="$router.push('/login')">登录</button>
          <button class="btn-nav primary" @click="$router.push('/register')">注册</button>
        </template>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
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
    isLoggedIn() {
      return !!this.user
    },
    username() {
      return (this.user && this.user.username) || '未登录'
    },
    avatarText() {
      const n = this.username
      return n && n !== '未登录' ? n.charAt(0).toUpperCase() : '?'
    },
    balanceCents() {
      return this.balance ? this.balance.balance_cents : null
    }
  },
  created() {
    // 游客不拉余额：否则无 token 调 /wallet/balance 会吃 1002，被拦截器整页跳去登录
    if (this.isLoggedIn) this.refreshBalance()
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
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  height: 64px;
  padding: 0 var(--space-lg);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  white-space: nowrap;
}
.brand .mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent-gradient);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 19px;
  box-shadow: 0 6px 16px rgba(47, 107, 255, 0.35);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.brand-text b {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}
.brand-text small {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 600;
  letter-spacing: 1.5px;
}
.nav {
  display: flex;
  gap: 4px;
  flex: 1;
}
.nav-item {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: 0.2s;
}
.nav-item:hover {
  color: var(--accent);
  background: var(--soft);
}
.nav-item.active {
  color: var(--accent);
  background: var(--soft);
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
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: var(--font-base);
  color: var(--text-primary);
  font-weight: 600;
  white-space: nowrap;
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent-gradient);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.btn-nav {
  border: 0;
  cursor: pointer;
  font-weight: 700;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 14px;
  transition: 0.2s;
  font-family: inherit;
  white-space: nowrap;
}
.btn-nav.primary {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 6px 16px rgba(47, 107, 255, 0.3);
}
.btn-nav.primary:hover {
  transform: translateY(-1px);
}
.btn-nav.ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-nav.ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
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
    height: 56px;
    padding: 0 var(--space);
  }
  .brand .mark {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    font-size: 16px;
  }
  .brand-text small {
    display: none;
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
