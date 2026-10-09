/**
 * 错误码 → 人话提示映射（板块 A · A6）
 * 全站统一从这里取文案，页面有更精准提示时可覆盖。
 */
import { ElMessage } from 'element-plus'

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

/** 直接 toast 一个业务错误（e 为拦截器抛出的 body：{ code, message, data }） */
export function toastError(e) {
  const code = e && e.code
  const msg = code != null ? errorMessage(code, e && e.message) : (e && e.message)
  ElMessage.error(msg || '请求失败，请稍后重试')
}
