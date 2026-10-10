/**
 * 路由（vue-router@4）
 * 守卫：无 token 只能去 /login、/register；已登录访问 /login 跳回首页
 * 受保护页面统一挂在 AppLayout 下（布局壳 + 移动底部 Tab）
 */
import { createRouter, createWebHistory } from 'vue-router'
import { storage } from '../utils/storage'
import AppLayout from '../components/AppLayout.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import WalletView from '../views/WalletView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import RechargeView from '../views/RechargeView.vue'
import RechargesView from '../views/RechargesView.vue'
import ProfileView from '../views/ProfileView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', name: 'home', component: HomeView, meta: { public: true } },
        { path: 'products', name: 'products', component: PlaceholderView, meta: { public: true, title: '商品' } },
        { path: 'orders', name: 'orders', component: PlaceholderView, meta: { title: '我的订单' } },
        { path: 'wallet', name: 'wallet', component: WalletView },
        { path: 'wallet/transactions', name: 'transactions', component: TransactionsView },
        { path: 'wallet/recharge', name: 'recharge', component: RechargeView },
        { path: 'wallet/recharges', name: 'recharges', component: RechargesView },
        { path: 'profile', name: 'profile', component: ProfileView }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach(to => {
  // 受保护页（无 meta.public）未登录 → 去登录，并带上回跳地址
  if (!to.meta.public && !storage.token)
    return { name: 'login', query: { redirect: to.fullPath } }
  // 已登录访问登录页 → 优先回 redirect 指的地方（只认站内路径），否则回首页
  if (to.name === 'login' && storage.token)
    return to.query.redirect && String(to.query.redirect).startsWith('/')
      ? to.query.redirect
      : { name: 'home' }
})
