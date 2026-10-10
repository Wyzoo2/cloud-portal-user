/**
 * v-reveal 滚动浮现指令
 * 用法：v-reveal 或 v-reveal="{ delay: 120 }"
 * 元素进入视口时淡入 + 上移，配合全局 .reveal / .reveal-visible 样式
 */
export const reveal = {
  mounted(el, binding) {
    el.classList.add('reveal')
    const delay = (binding.value && binding.value.delay) || 0
    if (delay) el.style.transitionDelay = delay + 'ms'

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => el.classList.add('reveal-visible'))
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
    )
    observer.observe(el)
    el._revealObserver = observer
  },
  unmounted(el) {
    if (el._revealObserver) el._revealObserver.disconnect()
  }
}
