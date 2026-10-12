/**
 * 响应式断点（板块 A · A2）
 * 全站统一三档：1000（收紧，仅间距/版心缩放）/ 768（移动形态，唯一开关）/ 560（窄屏）。
 * CSS 里写 media query 只能用这三个值；JS 里需要按屏幕切形态一律用 useIsMobile()，
 * 不要自己写 window.innerWidth 判断。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

export const MOBILE_MAX = 768

export function useIsMobile() {
  const isMobile = ref(
    typeof window !== 'undefined' &&
      window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches
  )
  let mql = null
  const update = () => { isMobile.value = mql.matches }

  onMounted(() => {
    mql = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`)
    update()
    mql.addEventListener('change', update)
  })
  onBeforeUnmount(() => { mql && mql.removeEventListener('change', update) })

  return isMobile
}
