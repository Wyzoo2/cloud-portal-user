/**
 * 响应式断点（板块 A · A2）
 * 全站统一 760px（vivo 至简三断点 1000/760/560 的移动端阈值）；
 * 需要按屏幕切换形态的组件用 useIsMobile()，勿各自写 media query 判断逻辑。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

export const MOBILE_MAX = 760

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
