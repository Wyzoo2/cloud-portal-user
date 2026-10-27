<template>
  <!-- 登录 / 注册共用外壳：深色品牌底 + 居中白卡 -->
  <div class="auth">
    <div class="backdrop" aria-hidden="true"></div>

    <main class="card">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
            stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h1>云平台统一门户</h1>
      <p class="sub">{{ subtitle }}</p>

      <slot />
    </main>
  </div>
</template>

<script>
export default {
  name: 'AuthShell',
  props: {
    subtitle: { type: String, default: '统一账号 · 统一钱包' }
  }
}
</script>

<style scoped>
.auth {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 32px 20px;
  overflow: hidden;
  background: var(--bg-dark);
}

/* 深色品牌底：光晕 + 网格 */
.backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(680px 420px at 78% -12%, rgba(51, 214, 255, 0.16), transparent 70%),
    radial-gradient(760px 460px at 6% 4%, rgba(29, 59, 214, 0.42), transparent 72%);
}
.backdrop::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(120% 90% at 50% 20%, #000 20%, transparent 78%);
  -webkit-mask-image: radial-gradient(120% 90% at 50% 20%, #000 20%, transparent 78%);
}

.card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 404px;
  padding: 34px 34px 26px;
  background: var(--bg-0);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--r-xl);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
}

/* 品牌标：站内渐变 */
.logo {
  width: 54px;
  height: 54px;
  margin: 0 auto 14px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--accent-gradient);
  box-shadow: 0 6px 14px rgba(29, 59, 214, 0.22);
}
.logo svg {
  width: 25px;
  height: 25px;
}

h1 {
  margin: 0;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-align: center;
  color: var(--ink);
}
.sub {
  margin: 5px 0 0;
  font-size: 12.5px;
  text-align: center;
  color: var(--ink-4);
}


@media (max-width: 768px) {  .auth {
    justify-content: flex-start;
    padding: 11vh 16px 24px;
  }
  .card {
    padding: 26px 20px 20px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
  }
}
</style>
