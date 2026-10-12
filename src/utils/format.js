/**
 * 展示工具函数：金额（分 → 元）、时间（后端返回什么就展示什么）
 */

/** 分 → 元；null / undefined 返回 '-' */
export function formatCents(cents) {
  if (cents === null || cents === undefined) return '-'
  return '¥' + (cents / 100).toFixed(2)
}

/**
 * 时间展示：**按后端返回的墙上时间原样展示，不做时区换算（不加 8 小时）**
 *
 * 产品口径（2026-10-12 确认）：后端返回的时间就是准确时间，前端不做变更。
 * 背景：`created_at` / `paid_at` 等字段实际是北京时间（墙上时间），但序列化时带了 `Z`；
 * 如果按 UTC 解析再转浏览器本地时区，会平白多出 8 小时（`2026-10-12T11:08:14Z` → 显示 19:08）。
 * 因此这里只取字符串中的年月日时分秒，忽略结尾的 `Z` 或 `±hh:mm`：
 * 带标记（`...Z` / `...+08:00`）与不带标记（`2026-10-12 11:08:14`）写法结果一致。
 *
 * 注意：全站时间只用于展示，任何排序/判断都用后端顺序或后端给定值，不要自行比较时间。
 */
export function formatTime(value, withSeconds = false) {
  if (!value) return '-'
  const s = String(value).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (m) {
    const base = `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`
    return withSeconds ? `${base}:${m[6] || '00'}` : base
  }
  // 兜底：不是常见的日期字符串（例如毫秒时间戳）→ 用 UTC 取值，同样避免被本地时区改写
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = n => String(n).padStart(2, '0')
  const base = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  return withSeconds ? `${base}:${pad(d.getUTCSeconds())}` : base
}
