<template>
  <div class="layout">
    <!-- 顶栏 -->
    <header class="header" :class="{ scrolled, dark: darkHeader }">
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
          <div class="balance" @click="$router.push('/account')">
            <template v-if="isFrozen">
              <span class="frozen-tag">已冻结</span>
            </template>
            <template v-else>余额 <AmountText :cents="balanceCents" strong /></template>
          </div>
          <el-dropdown @command="onCommand">
            <span class="user">
              <span class="avatar">{{ avatarText }}</span>{{ username }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">账户中心</el-dropdown-item>
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

    <!-- 内容区：首页与带深色页头带的内页需要通栏（深色带要铺满屏幕），由页面自己排版 -->
    <main class="content" :class="{ full: hasDarkHero }">
      <!-- 返回上一级由页面内的面包屑承担（页头带里「首页 / 上级 / 当前页」都可点）。
           这里不要再渲染行内返回按钮：它会占掉 ~55px，把通栏深色带顶到页头下面
           （页头此时是透明白字，会出现白字白底）。 -->
      <router-view />
    </main>

    <!-- 移动端不做底部 Tab 导航（产品要求：底栏会挡住商品/订单等页面的主操作与页脚）。
         移动端导航由「顶栏汉堡抽屉」承担，底部只保留右下角这颗悬浮胶囊（余额 + 当前账号）。
         订单详情页有固定支付栏，那一页不显示悬浮胶囊，避免盖住「立即支付」。 -->
    <div v-if="isLoggedIn && !hideDock" class="mobile-dock">
      <button class="dock-row" @click="$router.push('/account')">
        <span class="dock-label">余额</span>
        <AmountText :cents="balanceCents" strong />
      </button>
      <span class="dock-divider"></span>
      <button class="dock-row" @click="$router.push('/account')">
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
import { ElMessage } from 'element-plus'
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
    // 路由变化：收起移动端抽屉 + 已登录时刷新余额
    // （壳只创建一次，不监听就会一直停在首次余额快照；两件事合并成一个 watcher）
    '$route.fullPath'() {
      this.menuOpen = false
      if (this.isLoggedIn) this.refreshBalance()
    }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'balance', 'isFrozen']),
    isHome() {
      return this.$route.path === '/'
    },
    // 首页与带深色页头带的内页（route.meta.darkHero）都是通栏 + 页头透明压深色带
    hasDarkHero() {
      return this.isHome || !!this.$route.meta.darkHero
    },
    // 页头在页面顶部时透明，滚动后回到白底，保证可读性
    darkHeader() {
      return this.hasDarkHero && !this.scrolled
    },
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
    // 订单详情页底部有固定支付栏，悬浮胶囊会让开（否则会压住「立即支付」）
    hideDock() {
      return /^\/orders\/[^/]+$/.test(this.$route.path)
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
      // 账户中心包含钱包子页（消费流水 / 充值申请 / 充值记录），它们也要把「账户」点亮
      if (path === '/account') return p === '/account' || p.startsWith('/wallet')
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
        ElMessage.success('已退出登录')
      } else if (cmd === 'profile') {
        this.$router.push('/account')
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
  height: var(--header-h);
  padding: 0 var(--s-6);
  background: var(--bg-0);
  border-bottom: 1px solid var(--line);
  transition: background 0.2s, border-color 0.2s;
}
.header.scrolled {
  border-bottom-color: var(--line);
}
/* 首页首屏（B 方案）：页头透明压在深色带上；滚动后自动回到白底保证可读性 */
.header.dark {
  background: transparent;
  border-bottom-color: transparent;
}
.header.dark .brand-text b {
  color: #fff;
}
.header.dark .brand-text small {
  color: rgba(255, 255, 255, 0.5);
}
.header.dark .brand .mark {
  background: var(--accent-gradient);
}
.header.dark .nav-item {
  color: rgba(255, 255, 255, 0.72);
}
.header.dark .nav-item:hover,
.header.dark .nav-item.active {
  color: #fff;
}
.header.dark .nav-item.active::after {
  background: #fff;
}
.header.dark .balance {
  color: rgba(255, 255, 255, 0.72);
}
/* 深色页头里的金额要走白色（.amount.strong 默认是墨色，压在深色带上会看不见） */
.header.dark .balance :deep(.amount) {
  color: #fff;
}
.header.dark .user {
  color: #fff;
}
.header.dark .menu-btn {
  color: #fff;
  /* 深色页头上背景必须是半透明白，否则白底 + 白图标 = 看不见的方块 */
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.24);
}
.header.dark .menu-btn:active {
  background: rgba(255, 255, 255, 0.22);
}
.header.dark .btn-nav.ghost {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.28);
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
  border-radius: var(--r-md);
  background: var(--brand);
  display: grid;
  place-items: center;
  color: #fff;
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
  letter-spacing: -0.01em;
}
.brand-text small {
  font-size: 10px;
  color: var(--ink-4);
  font-weight: 600;
  letter-spacing: 2px;
}
.nav {
  display: flex;
  gap: 6px;
  flex: 1;
}
/* A 方案导航：13px 小号字距，激活只上主色 + 2px 下划线（不铺底色） */
.nav-item {
  position: relative;
  padding: 8px 14px;
  font-size: var(--font-sm);
  letter-spacing: 0.06em;
  color: var(--ink-2);
  transition: color 0.2s;
}
.nav-item:hover {
  color: var(--brand);
}
.nav-item.active {
  color: var(--brand);
  font-weight: 600;
}
.nav-item.active::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 2px;
  height: 2px;
  border-radius: 2px;
  background: var(--brand);
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
/* 冻结态：页头必须一眼看出来，且点进去是钱包页的冻结说明 */
.frozen-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--r-pill);
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 12px;
  font-weight: 700;
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
.header.dark .avatar {
  background: var(--accent-gradient);
}
.btn-nav {
  border: 0;
  cursor: pointer;
  font-weight: 600;
  border-radius: var(--r-md);
  padding: 9px 18px;
  font-size: 14px;
  transition: 0.2s;
  font-family: inherit;
  white-space: nowrap;
}
.btn-nav.primary {
  background: var(--brand);
  color: #fff;
}
.btn-nav.primary:hover {
  background: var(--brand-hover);
}
.btn-nav.ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line-strong);
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
  max-width: var(--wrap-app);
  margin: 0 auto;
  padding: var(--s-6);
}
/* 首页：解除版心与内边距，交给页面自己排版（B 方案需要通栏深色带） */
.content.full {
  max-width: none;
  padding: 0;
}
/* 「返回上一级」已由页面内的面包屑承担，这里不再有行内返回按钮 */

/* 移动端右下角悬浮胶囊（余额 + 账号）：桌面隐藏，移动端在 media query 里打开 */
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
  background: var(--brand);
  border-color: transparent;
  color: #fff;
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

@media (max-width: 768px) {
  .header {
    gap: var(--s-2);
    /* 高度由 --header-h 统一（:root 在 768 以下已改 56px） */
    padding: 0 var(--s-3);
  }
  .brand .mark {
    width: 30px;
    height: 30px;
    border-radius: var(--r-md);
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
    padding: var(--s-3) var(--s-3) calc(var(--s-10) + var(--safe-bottom));
  }
  /* 首页与内页都是通栏（深色带要贴边），底部余量由页脚自己让开悬浮胶囊 */
  .content.full {
    padding: 0;
  }

  /* ── 右下角悬浮胶囊（余额 + 账号）── */
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
