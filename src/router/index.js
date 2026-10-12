/**
 * 路由（vue-router@4）
 * 守卫策略：默认需要登录；标了 meta.public 的页面游客可访问（首页、商品页、登录、注册）
 * 受保护页面统一挂在 AppLayout 下（布局壳 + 移动底部 Tab）
 *
 * 性能：页面组件一律**懒加载**（() => import），首屏只下载当前路由的代码；
 * 布局壳 AppLayout 保持同步引入（它是所有内页的公共外壳，拆出去反而多一次往返）。
 */
import { createRouter, createWebHistory } from 'vue-router'
import { storage } from '../utils/storage'
import AppLayout from '../components/AppLayout.vue'

const LoginView = () => import('../views/LoginView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const HomeView = () => import('../views/HomeView.vue')
const ProductsView = () => import('../views/ProductsView.vue')
const OrdersView = () => import('../views/OrdersView.vue')
const AccountView = () => import('../views/AccountView.vue')
const TransactionsView = () => import('../views/TransactionsView.vue')
const RechargeView = () => import('../views/RechargeView.vue')
const RechargesView = () => import('../views/RechargesView.vue')
const OrderDetailView = () => import('../views/OrderDetailView.vue')

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
        // 以下页面都用「深色页头带 + 通栏分节」的首页格式（meta.darkHero 让顶栏透明压在深色带上）
        // 商品页游客可看（产品策略：不登录也能逛，点购买才要登录）
        { path: 'products', name: 'products', component: ProductsView, meta: { public: true, title: '商品', darkHero: true } },
        { path: 'orders', name: 'orders', component: OrdersView, meta: { title: '我的订单', darkHero: true } },
        // 订单详情（板块 D）：C2 下单成功后也跳这里，只传 order_id
        { path: 'orders/:id', name: 'order-detail', component: OrderDetailView, meta: { title: '订单详情', darkHero: true } },
        // 账户中心：钱包与「我的」已合并成一页
        { path: 'account', name: 'account', component: AccountView, meta: { title: '账户', darkHero: true } },
        // 老链接不失效：/wallet 与 /profile 一律回账户中心
        { path: 'wallet', redirect: '/account' },
        { path: 'profile', redirect: '/account' },
        { path: 'wallet/transactions', name: 'transactions', component: TransactionsView, meta: { title: '消费流水', darkHero: true } },
        { path: 'wallet/recharge', name: 'recharge', component: RechargeView, meta: { title: '充值申请', darkHero: true } },
        { path: 'wallet/recharges', name: 'recharges', component: RechargesView, meta: { title: '充值记录', darkHero: true } }
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
