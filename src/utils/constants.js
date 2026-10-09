/**
 * 文案与状态统一（板块 A · A7）
 * 术语、状态值 → 展示文本/颜色、导航菜单都在这里，全站共用，不许各页面另写一份。
 */

/* ── 导航菜单（布局壳与首页共用） ── */
export const APP_MENU = [
  { path: '/products', label: '商品' },
  { path: '/orders', label: '订单' },
  { path: '/wallet', label: '钱包' },
  { path: '/profile', label: '我的' }
]

/* ── 状态 → { text, type }，type 为 el-tag 的取值 ── */

// 订单状态：0 待支付 · 1 部分成功 · 2 全部成功 · 3 全部失败
export const ORDER_STATUS = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '部分成功', type: 'warning' },
  2: { text: '全部成功', type: 'success' },
  3: { text: '全部失败', type: 'danger' }
}

// 订单项状态：0 待支付 · 1 已支付 · 2 开通成功 · 3 失败待退款 · 4 已退款
export const ORDER_ITEM_STATUS = {
  0: { text: '待支付', type: 'info' },
  1: { text: '已支付', type: 'primary' },
  2: { text: '开通成功', type: 'success' },
  3: { text: '失败待退款', type: 'warning' },
  4: { text: '已退款', type: 'info' }
}

// 充值单状态：0 待核销 · 1 已到账 · 2 驳回
export const RECHARGE_STATUS = {
  0: { text: '待核销', type: 'warning' },
  1: { text: '已到账', type: 'success' },
  2: { text: '已驳回', type: 'danger' }
}

// 流水类型：1 充值 · 2 扣费 · 3 退款 · 4 调账
export const TRANSACTION_TYPE = {
  1: { text: '充值', sign: '+' },
  2: { text: '扣费', sign: '-' },
  3: { text: '退款', sign: '+' },
  4: { text: '调账', sign: '±' }
}
