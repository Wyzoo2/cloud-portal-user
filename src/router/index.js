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
        { path: '', name: 'home', component: HomeView },
        { path: 'products', name: 'products', component: PlaceholderView, meta: { title: '商品' } },
        { path: 'orders', name: 'orders', component: PlaceholderView, meta: { title: '我的订单' } },
        { path: 'wallet', name: 'wallet', component: PlaceholderView, meta: { title: '钱包' } },
        { path: 'wallet/transactions', name: 'transactions', component: PlaceholderView, meta: { title: '消费流水' } },
        { path: 'wallet/recharge', name: 'recharge', component: PlaceholderView, meta: { title: '充值' } },
        { path: 'wallet/recharges', name: 'recharges', component: PlaceholderView, meta: { title: '充值记录' } },
        { path: 'profile', name: 'profile', component: PlaceholderView, meta: { title: '我的' } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach(to => {
  if (!to.meta.public && !storage.token) return { name: 'login' }
  if (to.name === 'login' && storage.token) return { name: 'home' }
})
