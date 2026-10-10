/**
 * axios 请求模块
 * - 请求拦截：自动注入 JWT Bearer token
 * - 响应拦截：统一解包 { code, message, data }
 * - HTTP 状态码几乎永远 200，业务结果看 body.code：
 *   1003 token 过期 → 刷新后重放原请求；1002 未认证 → 踢回登录
 */
import axios from 'axios'
import { storage } from './storage'

export const http = axios.create({
  baseURL: storage.baseURL,
  timeout: 15000,
  withCredentials: true // refresh_token 是 HttpOnly Cookie，需浏览器自动携带
})

// 请求拦截：自动注入 JWT
http.interceptors.request.use(cfg => {
  if (storage.token) cfg.headers.Authorization = 'Bearer ' + storage.token
  return cfg
})

// 1003 刷新：单例 Promise 防并发刷新，成功后重放原请求
let refreshing = null
async function doRefreshToken() {
  // refresh_token 是 HttpOnly Cookie，前端拿不到，直接调接口即可
  const { data } = await axios.post(storage.baseURL + '/auth/refresh', null, {
    withCredentials: true,
    timeout: 15000
  })
  if (data && data.code !== 0) throw new Error(data.message || '刷新令牌失败')
  storage.token = data.data.access_token
  return data.data.access_token
}

http.interceptors.response.use(
  async resp => {
    const body = resp.data

    if (body && typeof body === 'object' && 'code' in body) {
      // 0 成功；3003 幂等重复（非错误，取首次结果）
      if (body.code === 0 || body.code === 3003) return body.data

      // 1003 token 过期 → 刷新后重放一次
      if (body.code === 1003 && !resp.config.__retried) {
        resp.config.__retried = true
        try {
          refreshing = refreshing || doRefreshToken().finally(() => { refreshing = null })
          const newToken = await refreshing
          resp.config.headers = resp.config.headers || {}
          resp.config.headers.Authorization = 'Bearer ' + newToken
          return http(resp.config)
        } catch (e) {
          storage.clear()
          if (window.location.pathname !== '/login') window.location.href = '/login'
          return Promise.reject(new Error('登录已过期，请重新登录'))
        }
      }

      // 1002 未认证 / token 无效 → 踢回登录
      if (body.code === 1002) {
        const hadToken = !!storage.token
        storage.clear()
        // 只有「曾有 token 却失效」才整页跳登录；游客在公开页触到 1002 是预期，静默即可
        if (hadToken && window.location.pathname !== '/login') window.location.href = '/login'
      }

      // 其余业务错误：抛出整个 body，页面用 catch (e) 拿 e.code / e.message / e.data
      return Promise.reject(body)
    }
    return body
  },
  err => {
    const msg = (err.response && err.response.data && err.response.data.message)
      || (err.code === 'ECONNABORTED' ? '请求超时，请检查网络' : '')
      || (err.message === 'Network Error' ? '无法连接服务器' : err.message)
    return Promise.reject(new Error(msg))
  }
)
