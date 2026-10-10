<template>
  <div class="layout">
    <!-- 顶栏 -->
    <header class="header" :class="{ scrolled }">
      <div class="brand" @click="$router.push('/')">
        <span class="mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
              stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
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
      <!-- 返回上一级（当前页有父级层级时显示） -->
      <button v-if="backTarget" class="back-btn" @click="$router.push(backTarget.path)">
        <svg class="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>返回{{ backTarget.label }}</span>
      </button>

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
    return { menu: APP_MENU, scrolled: false }
  },
  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.onScroll()
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll)
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
    },
    // 有父级层级的页面显示「返回上一级」
    backTarget() {
      const p = this.$route.path
      if (p.startsWith('/wallet/')) return { path: '/wallet', label: '钱包' }
      if (p.startsWith('/orders/')) return { path: '/orders', label: '我的订单' }
      if (p.startsWith('/products/')) return { path: '/products', label: '商品' }
      return null
    }
  },
  created() {
    // 游客不拉余额：否则无 token 调 /wallet/balance 会吃 1002，被拦截器整页跳去登录
    if (this.isLoggedIn) this.refreshBalance()
  },
  methods: {
    ...mapActions(useUserStore, ['logout', 'refreshBalance']),
    onScroll() {
      this.scrolled = window.scrollY > 8
    },
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
  gap: var(--s-6);
  height: 68px;
  padding: 0 var(--s-6);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.header.scrolled {
  border-bottom: 1px solid var(--line);
  box-shadow: var(--sh-1);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  white-space: nowrap;
}
.brand .mark {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--brand);
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: var(--sh-brand);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.brand-text b {
  font-size: 17px;
  font-weight: 600;
  color: var(--ink);
}
.brand-text small {
  font-size: 10px;
  color: var(--ink-4);
  font-weight: 600;
  letter-spacing: 2px;
}
.nav {
  display: flex;
  gap: 4px;
  flex: 1;
}
.nav-item {
  padding: 8px 16px;
  border-radius: var(--r-pill);
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-2);
  transition: 0.2s;
}
.nav-item:hover {
  color: var(--brand);
  background: var(--brand-weak);
}
.nav-item.active {
  color: var(--brand);
  background: var(--brand-weak);
}
.right {
  display: flex;
  align-items: center;
  gap: var(--s-4);
}
.balance {
  cursor: pointer;
  font-size: var(--font-base);
  color: var(--ink-3);
  white-space: nowrap;
}
.user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: var(--font-base);
  color: var(--ink);
  font-weight: 600;
  white-space: nowrap;
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--brand);
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
  box-shadow: var(--sh-brand);
}
.btn-nav.primary:hover {
  transform: translateY(-1px);
}
.btn-nav.ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line);
}
.btn-nav.ghost:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.content {
  flex: 1;
  width: 100%;
  max-width: var(--wrap);
  margin: 0 auto;
  padding: var(--s-6);
}
/* 返回上一级按钮 */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: var(--s-4);
  padding: 9px 20px 9px 15px;
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  color: var(--ink);
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.08);
  animation: backIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.back-btn .arrow {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.back-btn:hover {
  color: var(--brand);
  border-color: var(--brand);
  box-shadow: 0 6px 18px rgba(65, 95, 255, 0.16);
  transform: translateX(-3px);
}
.back-btn:hover .arrow {
  transform: translateX(-3px);
}
.back-btn:active {
  transform: translateX(-1px) scale(0.98);
}
@keyframes backIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.tabbar {
  display: none;
}

@media (max-width: 760px) {
  .header {
    gap: var(--s-2);
    height: 56px;
    padding: 0 var(--s-3);
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
    gap: var(--s-2);
  }
  .content {
    padding: var(--s-3) var(--s-3) calc(72px + var(--safe-bottom));
  }
  .back-btn {
    padding: 8px 16px 8px 13px;
    font-size: 13px;
    margin-bottom: var(--s-3);
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
    background: var(--bg-0);
    border-top: 1px solid var(--line);
  }
  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-sm);
    color: var(--ink-3);
  }
  .tab-item.active {
    color: var(--brand);
    font-weight: 600;
  }
}
</style>
