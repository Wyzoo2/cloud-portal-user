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

  function logout() {
    storage.clear()
    user.value = null
    balance.value = null
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

  return { user, balance, setUser, login, logout, refreshBalance }
})
