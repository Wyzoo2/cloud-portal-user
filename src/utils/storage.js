/**
 * localStorage 持久化层：token / 当前用户
 */
export const storage = {
  get token() { return localStorage.getItem('portal_access_token') || '' },
  set token(v) { v ? localStorage.setItem('portal_access_token', v) : localStorage.removeItem('portal_access_token') },

  // 接口前缀：开发走 vite 代理、生产同源 nginx 转发（后端真实地址见 vite.config.js）
  baseURL: '/api',

  get user() {
    try { return JSON.parse(localStorage.getItem('portal_user') || 'null') } catch { return null }
  },
  set user(v) { v ? localStorage.setItem('portal_user', JSON.stringify(v)) : localStorage.removeItem('portal_user') },

  clear() {
    ['portal_access_token', 'portal_user'].forEach(k => localStorage.removeItem(k))
  }
}
