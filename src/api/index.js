/**
 * API 定义（接口前缀 /api）
 * 响应统一为 { code, message, data }，拦截器已在 code===0 时解包返回 data
 * mock 开启（后端未就绪）时走 src/mock；联调时把 src/mock 的 USE_MOCK 改为 false 即切回真实接口
 */
import { http } from '../utils/request'
import { USE_MOCK, mock } from '../mock'

// mock 开启走假数据，否则走真实接口；两者签名一致，页面无需感知
const $ = (mockFn, realFn) => (...args) =>
  USE_MOCK && mockFn ? mockFn(...args) : realFn(...args)

export const api = {
  // 认证
  register: $(mock.register, payload => http.post('/auth/register', payload)),
  login: $(mock.login, (username, password) => http.post('/auth/login', { username, password })),
  // logout 支持可选 token：后端 logout 需要 Bearer，前端先清本地 token 后需手动带上
  logout: $(mock.logout, token => {
    const headers = token ? { Authorization: 'Bearer ' + token } : {}
    return http.post('/auth/logout', null, { headers })
  }),
  changePassword: $(mock.changePassword, (old_password, new_password) =>
    http.post('/auth/password', { old_password, new_password })
  ),

  // 商城
  getProducts: $(mock.getProducts, (params = {}) => http.get('/shop/products', { params })),
  createOrder: $(mock.createOrder, items => http.post('/shop/orders', { items })),
  // ⚠️ 订单列表：契约里没有定义这个接口，字段形状以后端真实样例为准。
  // 页面侧字段适配收敛在 OrdersView.vue 的 normalizeRow()，接口变了只改那一处。
  // 注：src/mock 里没有 getOrders，$() 会自动回落成真实请求（经 vite 代理到后端/mock 服务）
  getOrders: $(mock.getOrders, (params = {}) => http.get('/shop/orders', { params })),
  getOrder: $(mock.getOrder, id => http.get(`/shop/orders/${id}`)),
  payOrder: $(mock.payOrder, id => http.post(`/shop/orders/${id}/pay`)),

  // 钱包
  getBalance: $(mock.getBalance, () => http.get('/wallet/balance')),
  getTransactions: $(mock.getTransactions, (params = {}) => http.get('/wallet/transactions', { params })),
  rechargeApply: $(mock.rechargeApply, (amount_cents, remark) => http.post('/wallet/recharge/apply', { amount_cents, remark })),
  getRecharges: $(mock.getRecharges, (params = {}) => http.get('/wallet/recharges', { params }))
}
