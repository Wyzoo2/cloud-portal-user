<template>
  <div class="layout">
    <!-- 顶栏 -->
    <header class="header" :class="{ scrolled }">
      <!-- 左：Logo -->
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

      <!-- 中：PC 导航 -->
      <nav class="nav">
        <router-link v-for="m in menu" :key="m.path" :to="m.path" class="nav-item"
          :class="{ active: isActive(m.path) }">{{ m.label }}</router-link>
      </nav>

      <div class="right">
        <!-- 桌面端：已登录 → 余额 + 用户下拉 -->
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
        <!-- 桌面端：游客 → 登录 / 注册 -->
        <template v-else>
          <button class="btn-nav ghost" @click="$router.push('/login')">登录</button>
          <button class="btn-nav primary" @click="$router.push('/register')">注册</button>
        </template>

        <!-- 移动端：汉堡按钮（右上角） -->
        <button class="menu-btn" @click="menuOpen = true" aria-label="打开菜单">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" aria-hidden="true">
            <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
          </svg>
        </button>
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

    <!-- 移动端：右下角悬浮（余额 + 用户） -->
    <div v-if="isLoggedIn" class="mobile-dock">
      <button class="dock-row" @click="$router.push('/wallet')">
        <span class="dock-label">余额</span>
        <AmountText :cents="balanceCents" strong />
      </button>
      <span class="dock-divider"></span>
      <button class="dock-row" @click="$router.push('/profile')">
        <span class="dock-avatar">{{ avatarText }}</span>
        <span class="dock-name">{{ username }}</span>
      </button>
    </div>

    <!-- 移动端：汉堡抽屉 -->
    <transition name="fade">
      <div v-if="menuOpen" class="drawer-mask" @click="menuOpen = false"></div>
    </transition>
    <transition name="slide">
      <aside v-if="menuOpen" class="drawer" role="dialog" aria-label="导航菜单">
        <div class="drawer-head">
          <span class="drawer-title">导航</span>
          <button class="drawer-close" @click="menuOpen = false" aria-label="关闭菜单">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" aria-hidden="true">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <nav class="drawer-nav">
          <router-link v-for="m in menu" :key="m.path" :to="m.path" class="drawer-item"
            :class="{ active: isActive(m.path) }">
            <span>{{ m.label }}</span>
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </router-link>
        </nav>

        <div class="drawer-foot">
          <template v-if="isLoggedIn">
            <button class="drawer-btn danger" @click="onCommand('logout')">退出登录</button>
          </template>
          <template v-else>
            <button class="drawer-btn primary" @click="go('/register')">注册</button>
            <button class="drawer-btn" @click="go('/login')">登录</button>
          </template>
        </div>
      </aside>
    </transition>
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
    return { menu: APP_MENU, scrolled: false, menuOpen: false }
  },
  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.onScroll()
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  },
  watch: {
    // 路由变化自动收起抽屉
    $route() {
      this.menuOpen = false
    }
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
    go(path) {
      this.menuOpen = false
      this.$router.push(path)
    },
    onCommand(cmd) {
      this.menuOpen = false
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

/* 移动端汉堡按钮：桌面隐藏 */
.menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--bg-0);
  color: var(--ink-2);
  cursor: pointer;
  place-items: center;
  transition: 0.2s;
}
.menu-btn svg {
  width: 20px;
  height: 20px;
}
.menu-btn:active {
  background: var(--bg-2);
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

/* 移动端右下角悬浮：桌面隐藏 */
.mobile-dock {
  display: none;
}

/* 抽屉与遮罩：桌面默认不存在（v-if 控制，这里只定义桌面不显示的兜底） */
.drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(11, 16, 32, 0.42);
  backdrop-filter: blur(2px);
}
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 210;
  width: min(78vw, 320px);
  display: flex;
  flex-direction: column;
  background: var(--bg-0);
  box-shadow: var(--sh-3);
  padding: calc(var(--s-6) + env(safe-area-inset-top, 0px)) var(--s-5) var(--s-6);
  overflow-y: auto;
}
.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--s-5);
}
.drawer-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ink-4);
  text-transform: uppercase;
}
.drawer-close {
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.drawer-close svg {
  width: 18px;
  height: 18px;
}
.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.drawer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: var(--r-md);
  font-size: 16px;
  font-weight: 500;
  color: var(--ink-2);
  transition: 0.2s;
}
.drawer-item .chev {
  width: 16px;
  height: 16px;
  color: var(--ink-4);
}
.drawer-item:hover {
  background: var(--bg-1);
}
.drawer-item.active {
  color: var(--brand);
  background: var(--brand-weak);
  font-weight: 600;
}
.drawer-item.active .chev {
  color: var(--brand);
}
.drawer-foot {
  margin-top: auto;
  padding-top: var(--s-6);
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}
.drawer-btn {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--bg-0);
  color: var(--ink);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  padding: 13px 16px;
  border-radius: var(--r-pill);
  cursor: pointer;
  transition: 0.2s;
}
.drawer-btn.primary {
  background: var(--accent-gradient);
  border-color: transparent;
  color: #fff;
  box-shadow: var(--sh-brand);
}
.drawer-btn.danger {
  color: var(--danger);
  border-color: var(--danger-bg);
  background: var(--danger-bg);
}

/* 抽屉动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.26s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
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
  }
  .brand .mark svg {
    width: 16px;
    height: 16px;
  }
  .brand-text b {
    font-size: 15px;
  }
  .brand-text small {
    display: none;
  }
  /* 移动端：隐藏桌面导航与账户区 */
  .nav,
  .balance,
  .user,
  .btn-nav {
    display: none;
  }
  .right {
    margin-left: auto;
    gap: var(--s-2);
  }
  .menu-btn {
    display: grid;
  }
  .content {
    padding: var(--s-3) var(--s-3) calc(84px + var(--safe-bottom));
  }
  .back-btn {
    padding: 8px 16px 8px 13px;
    font-size: 13px;
    margin-bottom: var(--s-3);
  }

  /* 右下角悬浮胶囊 */
  .mobile-dock {
    display: flex;
    align-items: center;
    position: fixed;
    right: var(--s-3);
    bottom: calc(var(--s-3) + var(--safe-bottom));
    z-index: 60;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    box-shadow: var(--sh-3);
    overflow: hidden;
  }
  .dock-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    color: var(--ink-3);
    cursor: pointer;
    white-space: nowrap;
  }
  .dock-row:active {
    background: var(--bg-2);
  }
  .dock-divider {
    width: 1px;
    height: 20px;
    background: var(--line);
    flex-shrink: 0;
  }
  .dock-label {
    color: var(--ink-4);
  }
  .dock-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--brand);
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .dock-name {
    font-weight: 600;
    color: var(--ink);
    max-width: 76px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
