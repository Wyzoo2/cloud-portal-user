/**
 * mock 数据层（后端未就绪时的开发假数据）
 * - 字段严格对齐《用户端前端开发文档》§4 接口手册
 * - 联调时把 USE_MOCK 改为 false，即切回真实接口（src/api/index.js 已接入）
 * - 金额单位一律「分」；id 一律字符串
 */

export const USE_MOCK = false

/** 模拟网络延迟 */
function delay(data, ms = 280) {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

/** 模拟拦截器「原样抛出 body」的业务错误：{ code, message, data } */
function bizError(code, message, data = null) {
  return Promise.reject({ code, message, data })
}

/* ── 内存态「服务器」（localStorage 持久化，刷新不丢；清 localStorage 的 portal_mock_state 可重置演示数据） ── */

const STORE_KEY = 'portal_mock_state'

function defaultState() {
  return {
    user: { id: '018f0000-0000-4000-8000-000000000001', username: 'demo' },
    // 钱包：status 0 正常 / 1 冻结
    balance: { balance_cents: 17000, status: 0 },
    // 流水：type 1 充值 · 2 扣费 · 3 退款 · 4 调账
    transactions: [
      { id: '9106', type: 2, amount_cents: 16000, balance_after: 17000, product_code: 'desktop', bill_no: 'desktop-20261009-000111', detail: { plan: '办公型', period: '30天' }, created_at: '2026-10-09T02:00:00Z' },
      { id: '9105', type: 4, amount_cents: -5000, balance_after: 33000, product_code: null, bill_no: 'adj-20261008-000999', detail: { reason: '后台调账' }, created_at: '2026-10-08T05:00:00Z' },
      { id: '9104', type: 3, amount_cents: 3000, balance_after: 38000, product_code: 'desktop', bill_no: 'refund-20261007-000789', detail: { reason: '开通失败自动退款' }, created_at: '2026-10-07T03:00:00Z' },
      { id: '9103', type: 2, amount_cents: 12000, balance_after: 35000, product_code: 'phone', bill_no: 'phone-20261006-000456', detail: { plan: '性能版', period: '30天' }, created_at: '2026-10-06T08:00:00Z' },
      { id: '9102', type: 2, amount_cents: 3000, balance_after: 47000, product_code: 'storage', bill_no: 'storage-20261005-000123', detail: { plan: '续费·标准版', period: '30天' }, created_at: '2026-10-05T02:00:00Z' },
      { id: '9101', type: 1, amount_cents: 50000, balance_after: 50000, product_code: null, bill_no: 'R20261001001', detail: { channel: '微信转账', tail: '1234' }, created_at: '2026-10-01T02:00:00Z' }
    ],
    // 充值记录：status 0 待核销 · 1 已到账 · 2 驳回
    recharges: [
      { apply_id: '303', amount_cents: 20000, status: 2, balance_after: null, reject_reason: '转账凭证不清晰，请重新提交', created_at: '2026-10-07T09:00:00Z' },
      { apply_id: '302', amount_cents: 10000, status: 0, balance_after: null, reject_reason: null, created_at: '2026-10-08T06:00:00Z' },
      { apply_id: '301', amount_cents: 50000, status: 1, balance_after: 50000, reject_reason: null, created_at: '2026-10-01T01:00:00Z' }
    ],
    seq: 304
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved) {
      const s = JSON.parse(saved)
      if (s && Array.isArray(s.transactions) && Array.isArray(s.recharges)) return s
    }
  } catch (e) { /* 解析失败回退默认 */ }
  return defaultState()
}

const state = loadState()

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state))
  } catch (e) { /* 忽略存储失败 */ }
}

export const mock = {
  /* ── 认证 ── */

  // 演示账号：demo / demo1234（8 位含字母数字）
  login(username, password) {
    if (username === 'demo' && password === 'demo1234') {
      return delay({
        access_token: 'mock-access-token',
        expires_in: 7200,
        user: { ...state.user }
      })
    }
    if (username === 'disabled') return bizError(2004, '账号已被禁用，请联系平台')
    return bizError(2003, '账号或密码错误')
  },

  register(payload) {
    // 前端已先校验，这里兜底用户名重复
    if (payload && payload.username === 'demo') return bizError(2001, '用户名已存在')
    return delay({
      access_token: 'mock-access-token',
      expires_in: 7200,
      user: { id: '018f0000-0000-4000-8000-000000000002', username: payload.username }
    })
  },

  logout() {
    return delay({ ok: true }, 150)
  },

  /* ── 商城（C 板块待做，先给示例数据保链路） ── */

  getProducts() {
    return delay({ list: [] })
  },
  createOrder() {
    return delay({ order_id: 'mock-order', order_no: 'O-mock', total_cents: 0, status: 0, items: [] })
  },
  getOrder() {
    return delay({ order_id: 'mock-order', order_no: 'O-mock', total_cents: 0, status: 0, items: [] })
  },
  payOrder() {
    return delay({ order_id: 'mock-order', status: 0 })
  },

  /* ── 钱包 ── */

  getBalance() {
    return delay({ ...state.balance })
  },

  getTransactions(params = {}) {
    const page = Number(params.page) || 1
    const size = Number(params.size) || 20
    const type = params.type ? Number(params.type) : null
    let list = state.transactions
    if (type) list = list.filter(t => t.type === type)
    const total = list.length
    const start = (page - 1) * size
    return delay({ list: list.slice(start, start + size), total, page, size })
  },

  rechargeApply(amount_cents, remark) {
    const amt = Number(amount_cents)
    if (!(amt >= 100 && amt <= 10000000)) {
      return bizError(1001, '充值金额需在 ¥1 ~ ¥100,000 之间', { errors: ['充值金额需在 ¥1 ~ ¥100,000 之间'] })
    }
    const apply_id = String(state.seq++)
    state.recharges.unshift({
      apply_id,
      amount_cents: amt,
      status: 0,
      balance_after: null,
      reject_reason: null,
      created_at: new Date().toISOString()
    })
    saveState()
    return delay({
      apply_id,
      status: 0,
      notice: '申请已提交，请线下转账后等待管理员核销，到账后余额自动更新'
    })
  },

  getRecharges(params = {}) {
    const page = Number(params.page) || 1
    const size = Number(params.size) || 20
    const status = params.status != null && params.status !== '' ? Number(params.status) : null
    let list = state.recharges
    if (status != null) list = list.filter(r => r.status === status)
    const total = list.length
    const start = (page - 1) * size
    return delay({ list: list.slice(start, start + size), total, page, size })
  }
}
