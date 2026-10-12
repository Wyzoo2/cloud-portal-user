/**
 * 用户登录态 + 余额（pinia）
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { storage } from '../utils/storage'
import { api } from '../api'

export const useUserStore = defineStore('user', () => {
  const user = ref(storage.user || null)
  // { balance_cents, status }；status 0 正常 / 1 冻结
  const balance = ref(null)
  // 余额拉取失败标记：让页面能显示错误态，而不是把 null 当成"正常"
  const balanceError = ref(false)
  // 钱包冻结：页头标识、支付/下单入口禁用都读它（status 可能是字符串，做一次数字归一）
  const isFrozen = computed(() => Number(balance.value && balance.value.status) === 1)

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
    balanceError.value = false
    // 后端 logout 需要 Bearer，这里手动带上已保存的 token 吊销服务端 refresh cookie
    if (token) {
      api.logout(token).catch(() => {})
    }
  }

  /**
   * 拉取余额（布局壳常驻显示、支付/充值后刷新）；失败置 balanceError 供页面出错误态。
   *
   * 并发去重：布局壳监听路由变化会刷一次，账户页自己也会刷一次，
   * 同一时刻的两个调用原来会发两个一模一样的请求。这里把「进行中的 Promise」复用，
   * 并发调用只发一次网络请求，返回值完全相同，所以对调用方是透明的。
   */
  let balanceInflight = null
  function refreshBalance() {
    if (balanceInflight) return balanceInflight
    balanceInflight = (async () => {
      try {
        balance.value = await api.getBalance()
        balanceError.value = false
      } catch (e) {
        balance.value = null
        balanceError.value = true
      } finally {
        balanceInflight = null
      }
      return balance.value
    })()
    return balanceInflight
  }

  return { user, balance, balanceError, isFrozen, setUser, login, register, logout, refreshBalance }
})
