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

  // 会话代号：登录 / 注册 / 登出都自增，用来丢弃「上一个会话」还在飞行的余额响应
  // （否则 A 登出、B 登录后，A 的余额响应回来会写进 B 的会话）
  let sessionSeq = 0
  // 余额并发去重用的「进行中 Promise」（见 refreshBalance）
  let balanceInflight = null

  async function login(username, password) {
    sessionSeq += 1
    balanceInflight = null
    const res = await api.login(username, password)
    assertEntry(res, 'personal')
    applyLoginResult(res)
    return res
  }

  // 企业员工登录：入口与账号性质不匹配时按契约返回 2006
  async function loginEnterprise(username, password) {
    sessionSeq += 1
    balanceInflight = null
    const res = await api.loginEnterprise(username, password)
    assertEntry(res, 'enterprise')
    applyLoginResult(res)
    return res
  }

  /** 入口与账号性质校验（写入 token 之前） */
  function assertEntry(res, entry) {
    const user = (res && res.user) || {}
    // 旧后端没有 user_type，按个人账号处理
    const ut = user.user_type == null ? 0 : Number(user.user_type)

    if (entry === 'enterprise' && ut !== 1) {
      throw { code: 2006, message: '该账号是个人账号，请使用个人登录' }
    }
    if (entry === 'personal' && ut === 1) {
      throw { code: 2006, message: '该账号是企业员工账号，请使用企业员工入口' }
    }
    // 企业账号必须有企业归属
    if (ut === 1 && !user.enterprise_id) {
      throw { code: 'NO_ENTERPRISE', message: '该账号未归属企业，请联系企业管理员' }
    }
  }

  /** 企业自助注册：只提交申请，不自动登录（企业是 pending，登录会 2011） */
  async function registerEnterprise(payload) {
    return api.registerEnterprise(payload)
  }

  /** 登录结果统一落盘：两种入口返回结构一致 { access_token, user } */
  function applyLoginResult(res) {
    if (!res || !res.access_token) {
      // 结构异常不写入，避免被守卫反复弹回登录页
      throw { code: 'NOT_READY', message: '登录接口返回异常，请稍后重试' }
    }
    storage.token = res.access_token
    setUser(res.user)
  }

  /** 注册即登录：接口返回结构同登录 */
  async function register(payload) {
    sessionSeq += 1
    balanceInflight = null
    const res = await api.register(payload)
    applyLoginResult(res)
    return res
  }

  function logout() {
    // 先存 token → 同步清本地（立即生效，避免路由守卫仍读到 token）→ 用存下的 token 调登出
    const token = storage.token
    // 作废当前会话：在途的余额请求回来时会被丢弃，不会把上一个账号的余额写进新会话
    sessionSeq += 1
    balanceInflight = null
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
   *
   * 会话校验：响应回来时若已经登出/换号（sessionSeq 变了），这次结果直接丢弃，
   * 否则会把上一个账号的余额写进当前会话。
   */
  function refreshBalance() {
    if (balanceInflight) return balanceInflight
    const seq = sessionSeq
    balanceInflight = (async () => {
      try {
        const data = await api.getBalance()
        if (seq !== sessionSeq) return null
        balance.value = data
        balanceError.value = false
      } catch (e) {
        if (seq !== sessionSeq) return null
        balance.value = null
        balanceError.value = true
      } finally {
        if (seq === sessionSeq) balanceInflight = null
      }
      return balance.value
    })()
    return balanceInflight
  }

  return {
    user, balance, balanceError, isFrozen,
    setUser,
    login, loginEnterprise,
    register, registerEnterprise,
    logout, refreshBalance
  }
})
