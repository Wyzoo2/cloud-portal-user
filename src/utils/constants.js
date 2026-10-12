/**
 * 文案与状态统一（板块 A · A7）
 * 术语、状态值 → 展示文本/颜色、导航菜单都在这里，全站共用，不许各页面另写一份。
 */

/* ── 导航菜单（布局壳 AppLayout 用；PC 顶栏与移动端抽屉共用这一份）
     账户中心 = 原「钱包」+「我的」合并后的单页
     移动端不做底部 Tab 导航（产品要求），所以这里不需要图标 ── */
export const APP_MENU = [
  { path: '/', label: '首页' },
  { path: '/products', label: '商品' },
  { path: '/orders', label: '订单' },
  { path: '/account', label: '账户' }
]

/* ── 产品线代码 → 中文名（流水/订单里只有 product_code，展示要转中文） ── */
export const PRODUCT_LINE = { storage: '云存储', phone: '云手机', desktop: '云电脑' }
export const productLineName = code => PRODUCT_LINE[code] || code || '-'

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
// type 为 el-tag/StatusTag 的取值；调账(4)的方向由金额正负决定，所以不给固定 sign
export const TRANSACTION_TYPE = {
  1: { text: '充值', sign: '+', type: 'success' },
  2: { text: '扣费', sign: '-', type: 'danger' },
  3: { text: '退款', sign: '+', type: 'success' },
  4: { text: '调账', type: 'neutral' }
}

// 钱包状态：0 正常 · 1 冻结
export const WALLET_STATUS = {
  0: { text: '正常', type: 'success' },
  1: { text: '已冻结', type: 'danger' }
}

/* ── 订单项失败原因（fail_reason）→ 中文 ──
   取值由产品侧回传（后端答复 §3）：PROVISION_FAILED / PROVISION_REJECTED /
   数字码 4003 / 4004 / NETWORK / BAD_RESPONSE，且可能随产品迭代新增。
   ⚠️ 不要穷举 switch 后显示"未知错误"：清单外一律用兜底文案。 */
export const FAIL_REASON = {
  PROVISION_FAILED: '开通失败（重试后仍未成功）',
  PROVISION_REJECTED: '产品侧拒绝开通',
  4003: '商品不存在或已下架',
  4004: '库存不足',
  NETWORK: '网络异常',
  BAD_RESPONSE: '产品返回数据异常'
}
export const failReasonText = code => FAIL_REASON[code] || '开通失败，已自动退款'

/* ── 流水明细（detail）字段名 → 中文标签 ──
   detail 是产品侧回传的任意 JSON。**未列出的字段一律不展示**：
   直接把 key 渲染到页面上会暴露 order_no / product_code 这类英文字段名，
   用户看不懂。后端加了新字段也不会穿帮，只是暂不显示，需要时在下面补一行即可。 */
export const DETAIL_LABELS = {
  // 订单 / 商品
  order_no: '订单号',
  order_id: '订单号',
  item_no: '订单项',
  item_id: '订单项',
  product_code: '产品线',
  product_name: '商品',
  sku_id: '规格',
  spec: '规格',
  quantity: '数量',
  // 充值
  recharge_id: '充值单号',
  apply_id: '充值单号',
  admin_id: '审核人',
  // 通用
  amount_cents: '金额',
  reason: '原因',
  fail_reason: '失败原因',
  remark: '备注',
  note: '说明',
  operator: '操作人',
  bill_no: '流水号'
}

/* ── 筛选 tab：一律从上面的状态表派生，各页面别再抄一份文案 ── */
const tabsOf = map => [
  { value: '', label: '全部' },
  ...Object.entries(map).map(([value, meta]) => ({ value: Number(value), label: meta.text }))
]

export const ORDER_STATUS_TABS = tabsOf(ORDER_STATUS)
export const RECHARGE_STATUS_TABS = tabsOf(RECHARGE_STATUS)
export const TRANSACTION_TYPE_TABS = tabsOf(TRANSACTION_TYPE)
