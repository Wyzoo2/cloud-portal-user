/**
 * 错误码 → 人话提示映射（板块 A · A6）
 * 全站统一从这里取文案：页面不要自己写错误分支文案，也不要再各抄一份 1001 的展开逻辑。
 */
// ElMessage 由 unplugin-auto-import 按需注入（见 vite.config.js）；
// 显式 `from 'element-plus'` 会把整个主包拖进来，tree-shaking 失效

export const ERROR_MESSAGES = {
  1001: '参数有误',
  1002: '请先登录',
  1003: '登录已过期',
  1004: '没有权限',
  2001: '用户名已存在',
  2002: '手机号已注册',
  2003: '账号或密码错误',
  2004: '账号已被禁用',
  3001: '余额不足',
  3002: '钱包已冻结，请联系平台',
  3004: '退款金额超出可退余额',
  3005: '账单不存在',
  4001: '订单不存在',
  4002: '订单状态不允许该操作',
  4003: '商品不存在或已下架',
  4004: '库存不足',
  5001: '服务开小差了，请稍后重试'
}

/** 根据业务错误取文案；3003 幂等重复不是错误，返回空串 */
export function errorMessage(code, fallback) {
  if (code === 3003) return ''
  return ERROR_MESSAGES[code] || fallback || '请求失败，请稍后重试'
}

/**
 * 业务错误 → 逐条人话数组
 * 1001 的 data.errors 是「字符串数组」（每个非法字段一条），必须逐条展示；
 * 其他情况退化成单条，永远不返回空数组、也不会出现"未知错误"。
 */
export function errorList(e) {
  if (e && e.code === 3003) return []
  const errs = e && e.data && Array.isArray(e.data.errors) ? e.data.errors : []
  const list = errs.map(x => String(x)).filter(s => s && s.trim())
  if (list.length) return list
  const msg = e && e.code != null ? errorMessage(e.code, e && e.message) : (e && e.message)
  return [msg || '请求失败，请稍后重试']
}

/** 业务错误 → 单条人话（多条用「；」连接，适合 el-alert / 表单下方） */
export function errorText(e) {
  return errorList(e).join('；')
}

/** 直接 toast 一个业务错误（多条逐条弹，e 为拦截器抛出的 body：{ code, message, data }） */
export function toastError(e) {
  const list = errorList(e)
  if (!list.length) return
  list.forEach(msg => ElMessage.error(msg))
}
