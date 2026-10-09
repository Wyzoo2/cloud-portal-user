/**
 * API 定义（接口前缀 /api）
 * 响应统一为 { code, message, data }，拦截器已在 code===0 时解包返回 data
 */
import { http } from '../utils/request'

export const api = {
  // 认证
  register: payload => http.post('/auth/register', payload),
  login: (username, password) => http.post('/auth/login', { username, password }),
  logout: () => http.post('/auth/logout'),

  // 商城
  getProducts: (params = {}) => http.get('/shop/products', { params }),
  createOrder: items => http.post('/shop/orders', { items }),
  getOrder: id => http.get(`/shop/orders/${id}`),
  payOrder: id => http.post(`/shop/orders/${id}/pay`),

  // 钱包
  getBalance: () => http.get('/wallet/balance'),
  getTransactions: (params = {}) => http.get('/wallet/transactions', { params }),
  rechargeApply: (amount_cents, remark) => http.post('/wallet/recharge/apply', { amount_cents, remark })
}
