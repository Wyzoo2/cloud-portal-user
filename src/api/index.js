/**
 * API 定义（接口前缀 /api）
 * 响应统一为 { code, message, data }，拦截器已在 code===0 时解包返回 data。
 * 全部走真实后端，开发期由 vite 代理 /api（后端地址见 vite.config.js）。
 */
import { http } from '../utils/request'

export const api = {
  // 认证
  register: payload => http.post('/auth/register', payload),
  login: (username, password) => http.post('/auth/login', { username, password }),
  // 企业员工登录：后端暂无独立接口，与个人共用 /auth/login（入口校验在前端）
  loginEnterprise: (username, password) => http.post('/auth/login', { username, password }),
  // 企业自助注册（C 端免登录）：企业与管理员账号一并建出，初始 status = pending
  registerEnterprise: payload => http.post('/enterprise/register', payload),
  // logout 需要 Bearer：前端先清本地 token，所以把存下的 token 显式传进来
  logout: token => {
    const headers = token ? { Authorization: 'Bearer ' + token } : {}
    return http.post('/auth/logout', null, { headers })
  },
  changePassword: (old_password, new_password) =>
    http.post('/auth/password', { old_password, new_password }),

  // 商城
  getProducts: (params = {}) => http.get('/shop/products', { params }),
  createOrder: items => http.post('/shop/orders', { items }),
  // 订单列表：后端已支持 page/size/status 筛选，返回结构与详情一致（含 items）
  getOrders: (params = {}) => http.get('/shop/orders', { params }),
  getOrder: id => http.get(`/shop/orders/${id}`),
  payOrder: id => http.post(`/shop/orders/${id}/pay`),

  // 钱包
  getBalance: () => http.get('/wallet/balance'),
  getTransactions: (params = {}) => http.get('/wallet/transactions', { params }),
  rechargeApply: (amount_cents, remark) =>
    http.post('/wallet/recharge/apply', { amount_cents, remark }),
  getRecharges: (params = {}) => http.get('/wallet/recharges', { params })
}
