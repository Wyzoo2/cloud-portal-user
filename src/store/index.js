/**
 * 用户登录态 + 余额（pinia）
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '../utils/storage'
import { api } from '../api'

export const useUserStore = defineStore('user', () => {
  const user = ref(storage.user || null)
  // { balance_cents, status }；status 0 正常 / 1 冻结
  const balance = ref(null)

  function setUser(u) {
    user.value = u
    storage.user = u
  }

  async function login(username, password) {
    const res = await api.login(username, password)
    storage.token = res.access_token
    setUser(res.user)
    return res
  }

  /** 注册即登录：接口返回结构同登录 */
  async function register(payload) {
    const res = await api.register(payload)
    storage.token = res.access_token
    setUser(res.user)
    return res
  }

  function logout() {
    // 先存 token → 同步清本地（立即生效，避免路由守卫仍读到 token）→ 用存下的 token 调登出
    const token = storage.token
    storage.clear()
    user.value = null
    balance.value = null
    // 后端 logout 需要 Bearer，这里手动带上已保存的 token 吊销服务端 refresh cookie
    if (token) {
      api.logout(token).catch(() => {})
    }
  }

  /** 拉取余额（布局壳常驻显示、支付/充值后刷新） */
  async function refreshBalance() {
    try {
      balance.value = await api.getBalance()
    } catch (e) {
      balance.value = null
    }
    return balance.value
  }

  return { user, balance, setUser, login, register, logout, refreshBalance }
})
