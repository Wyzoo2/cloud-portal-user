/**
 * mock 数据层（后端未就绪时的开发假数据）
 * - 字段严格对齐《用户端前端开发文档》§4 接口手册
 * - 联调时把 USE_MOCK 改为 false，即切回真实接口（src/api/index.js 已接入）
 * - 金额单位一律「分」；id 一律字符串
 */

export const USE_MOCK = true

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

/* ── 商品目录（C 板块 · C1 商品列表用）────────────────────────────
   字段对齐《API 契约》§2.1 / 《前端开发文档》§4.2。
   故意覆盖 C1 的全部显示分支：
     storage-1t        stock === null      → 显示「现货」
     storage-metered   billing_mode === 2  → 显示「后付费」
     desktop-basic     stock === 0         → 显示「已售罄」且按钮禁用
   注意：契约里商品结构【没有图片字段】，所以卡片只用文字/图标，不放图。 */
const PRODUCTS = [
  { product_code: 'storage', sku_id: 'storage-500g', name: '云存储·500G',
    spec: { quota_gb: 500, region: '华东1' }, price_cents: 3000,
    billing_mode: 1, period_days: 30, stock: 43, synced_at: '2026-10-09T03:00:00Z' },
  { product_code: 'storage', sku_id: 'storage-1t', name: '云存储·1T',
    spec: { quota_gb: 1024, region: '华东1', transfer: '不限量' }, price_cents: 5500,
    billing_mode: 1, period_days: 30, stock: null, synced_at: '2026-10-09T03:00:00Z' },
  { product_code: 'storage', sku_id: 'storage-metered', name: '云存储·按量计费',
    spec: { quota_gb: 100, note: '用多少扣多少' }, price_cents: 0,
    billing_mode: 2, stock: null, synced_at: '2026-10-09T03:00:00Z' },
  { product_code: 'phone', sku_id: 'phone-standard', name: '云手机·标准版',
    spec: { vcpu: 2, ram_gb: 2, storage_gb: 16, ip: '独立IP' }, price_cents: 3000,
    billing_mode: 1, period_days: 30, stock: 43, synced_at: '2026-10-09T03:00:00Z' },
  { product_code: 'desktop', sku_id: 'desktop-basic', name: '云电脑·办公型',
    spec: { vcpu: 4, ram_gb: 8, disk_gb: 80, os: 'Windows' }, price_cents: 16900,
    billing_mode: 1, period_days: 30, stock: 0, synced_at: '2026-10-09T03:00:00Z' }
]

/** 造一个订单项（id 一律字符串） */
function mkItem(item_id, product_code, sku_id, quantity, price_cents, status, extra = {}) {
  return { item_id, product_code, sku_id, quantity, price_cents, status,
    instance_id: null, expire_at: null, fail_reason: null, ...extra }
}

/* ── 订单（C 板块 · C3 订单列表用）──────────────────────────────
   预置 6 笔，覆盖订单 4 种状态 + 订单项 5 种状态：
     9001 部分成功（一项开通成功 + 一项已退款）
     9002 全部失败（失败待退款）
     9003 待支付
     9004 全部成功
     9005 天价待支付（给 D 组测 3001 余额不足用）
     9006 处理中样板（item.status 停在 1，用来调「处理中」UI） */
function defaultOrders() {
  return [
    { order_id: '9001', order_no: 'O20261001-000901', total_cents: 6000, status: 1,
      created_at: '2026-10-01T02:00:00Z', paid_at: '2026-10-01T02:01:00Z', items: [
        mkItem('31', 'phone', 'phone-standard', 2, 6000, 2,
          { instance_id: 'ph-0001', expire_at: '2026-10-31T02:01:00Z' }),
        mkItem('32', 'storage', 'storage-1t', 1, 5500, 4, { fail_reason: 'OUT_OF_STOCK' })
      ] },
    { order_id: '9002', order_no: 'O20261002-000902', total_cents: 3000, status: 3,
      created_at: '2026-10-02T02:00:00Z', paid_at: '2026-10-02T02:01:00Z', items: [
        mkItem('33', 'storage', 'storage-500g', 1, 3000, 3, { fail_reason: 'PROVISION_TIMEOUT' })
      ] },
    { order_id: '9003', order_no: 'O20261003-000903', total_cents: 3000, status: 0,
      created_at: '2026-10-03T02:00:00Z', paid_at: null, items: [
        mkItem('34', 'storage', 'storage-500g', 1, 3000, 0)
      ] },
    { order_id: '9004', order_no: 'O20261004-000904', total_cents: 8500, status: 2,
      created_at: '2026-10-04T02:00:00Z', paid_at: '2026-10-04T02:01:00Z', items: [
        mkItem('35', 'phone', 'phone-standard', 1, 3000, 2,
          { instance_id: 'ph-0002', expire_at: '2026-11-03T02:01:00Z' }),
        mkItem('36', 'storage', 'storage-1t', 1, 5500, 2,
          { instance_id: 'storage-0007', expire_at: '2026-11-03T02:01:00Z' })
      ] },
    { order_id: '9005', order_no: 'O20261005-000905', total_cents: 9999900, status: 0,
      created_at: '2026-10-05T02:00:00Z', paid_at: null, items: [
        mkItem('37', 'desktop', 'desktop-basic', 10, 9999900, 0)
      ] },
    { order_id: '9006', order_no: 'O20261006-000906', total_cents: 3000, status: 1,
      created_at: '2026-10-06T02:00:00Z', paid_at: '2026-10-06T02:01:00Z', items: [
        mkItem('38', 'storage', 'storage-500g', 1, 3000, 1)
      ] }
  ]
}

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
    seq: 304,          // 充值申请号自增
    orderSeq: 9007,    // 订单一侧自增（订单号 / 订单项号），避开预置的 9001~9006 与 31~38
    orders: defaultOrders()
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

// 兼容旧版 localStorage：老数据没有 orders / orderSeq 字段，缺了就补，避免升级后报错
if (!Array.isArray(state.orders)) state.orders = defaultOrders()
if (typeof state.orderSeq !== 'number') state.orderSeq = 9007

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

  /* ── 商城（C 板块：getProducts / createOrder / getOrders）──
     本文件只实现 C 板块用得上的这 3 个接口。
     getOrder（订单详情）/ payOrder（支付）属于 D 板块，这里不提供 ——
     src/api/index.js 的 $() 检测到 mockFn 为 undefined 时会自动回落到真实 HTTP，
     由 D 组自行决定是走 HTTP 还是补数据。 */

  // GET /shop/products
  getProducts(params = {}) {
    const pc = params.product_code
    const list = (pc ? PRODUCTS.filter(p => p.product_code === pc) : PRODUCTS)
      .map(p => ({ ...p, spec: { ...p.spec } }))
    return delay({ list })
  },

  // POST /shop/orders —— ★ 入参不带价格，「后端」按当前目录重算
  createOrder(items) {
    const arr = Array.isArray(items) ? items : []
    if (arr.length < 1 || arr.length > 10) {
      return bizError(1001, '参数校验失败', { errors: ['一单只能购买 1~10 项'] })
    }
    const built = []
    let total = 0
    for (const it of arr) {
      const qty = Number(it.quantity || 1)
      const p = PRODUCTS.find(x => x.product_code === it.product_code && x.sku_id === it.sku_id)
      if (!p) return bizError(4003, '商品不存在或已下架')
      if (qty < 1 || qty > 10) {
        return bizError(1001, '参数校验失败', { errors: [`${p.name} 的数量需在 1~10 之间`] })
      }
      if (p.product_code === 'phone' && qty > 3) {
        return bizError(1001, '参数校验失败', { errors: ['云手机单项最多购买 3 台'] })
      }
      if (p.stock === 0) return bizError(4004, '库存不足')
      total += p.price_cents * qty
      built.push(mkItem(String(state.orderSeq++), p.product_code, p.sku_id, qty,
        p.price_cents * qty, 0))
    }
    const now = new Date()
    const order = {
      order_id: String(state.orderSeq++),
      order_no: 'O' + now.toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(state.orderSeq),
      total_cents: total,
      status: 0,
      created_at: now.toISOString(),
      paid_at: null,
      items: built
    }
    state.orders.unshift(order)
    saveState()
    return delay({
      order_id: order.order_id,
      order_no: order.order_no,
      total_cents: total,
      status: order.status,
      items: order.items
    })
  },

  /* GET /shop/orders —— ⚠️ 契约里没有定义这个接口，下面的字段形状是按 C3 页面
     需要【假设】的，以后端真实样例为准。页面侧字段适配收敛在
     OrdersView.vue 的 normalizeRow() 里，接口变了只改那一处。 */
  getOrders(params = {}) {
    const page = Number(params.page) || 1
    const size = Number(params.size) || 20
    // 与真后端保持一致：status 为可选筛选（0 待支付 / 1 部分成功 / 2 全部成功 / 3 全部失败），
    // 非法值返回 1001（真后端实测：status=999 → code=1001）
    const status = params.status != null && params.status !== '' ? Number(params.status) : null
    if (status !== null && ![0, 1, 2, 3].includes(status)) {
      return bizError(1001, '参数校验失败', { errors: ['status must be one of: 0, 1, 2, 3'] })
    }
    let list = state.orders
    if (status !== null) list = list.filter(o => o.status === status)
    const total = list.length
    const start = (page - 1) * size
    const rows = list.slice(start, start + size).map(o => ({
      order_id: o.order_id,
      order_no: o.order_no,
      total_cents: o.total_cents,
      status: o.status,
      created_at: o.created_at,
      paid_at: o.paid_at,
      item_count: o.items.length,
      product_codes: [...new Set(o.items.map(i => i.product_code))],
      summary: o.items.map(i => {
        const p = PRODUCTS.find(x => x.sku_id === i.sku_id)
        return `${p ? p.name : i.sku_id} ×${i.quantity}`
      }).join('，')
    }))
    return delay({ list: rows, total, page, size })
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
