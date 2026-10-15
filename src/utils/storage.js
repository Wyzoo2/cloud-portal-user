/**
 * localStorage 持久化层：token / 当前用户
 */
import { API_BASE } from '../deploy.config'

export const storage = {
  get token() { return localStorage.getItem('portal_access_token') || '' },
  set token(v) { v ? localStorage.setItem('portal_access_token', v) : localStorage.removeItem('portal_access_token') },

  // 接口前缀：由 src/deploy.config.js 的 MOUNTED 切换（/api ↔ /portal/api）
  baseURL: API_BASE,

  get user() {
    try { return JSON.parse(localStorage.getItem('portal_user') || 'null') } catch { return null }
  },
  set user(v) { v ? localStorage.setItem('portal_user', JSON.stringify(v)) : localStorage.removeItem('portal_user') },

  clear() {
    ['portal_access_token', 'portal_user'].forEach(k => localStorage.removeItem(k))
  }
}
