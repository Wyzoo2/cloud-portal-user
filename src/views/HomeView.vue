<template>
  <div class="home">
    <!-- Hero：深色首屏 + 光晕 -->
    <section class="hero">
      <div class="hero-grid">
        <!-- 左栏文字 -->
        <div class="hero-text" v-reveal>
          <div class="hero-kicker">CLOUD PORTAL</div>
          <h1>一个平台，租遍<br /><span class="grad">云存储 · 云手机 · 云电脑</span></h1>
          <p class="hero-sub">统一账号、统一钱包，资源即开即用</p>
          <div class="hero-tags">
            <span>秒级开通</span>
            <span>一个钱包</span>
            <span>安全隔离</span>
            <span>7×24 运维</span>
          </div>
          <div class="hero-cta">
            <button class="btn-hero primary" @click="$router.push(isLoggedIn ? '/products' : '/register')">
              {{ isLoggedIn ? '浏览商品' : '立即开始' }}
            </button>
            <button class="btn-hero ghost" @click="$router.push('/products')">了解产品</button>
          </div>
        </div>

        <!-- 右栏玻璃数据卡 -->
        <div class="hero-card">
          <h4>实时资源看板 <span class="demo-tag">示例</span></h4>
          <div class="hc-row" v-for="r in panel" :key="r.name">
            <div class="hc-l">
              <span class="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round" v-html="r.path"></svg>
              </span>
              <div><b>{{ r.name }}</b><small>{{ r.small }}</small></div>
            </div>
            <span class="hc-num">{{ r.num }} <em>{{ r.unit }}</em></span>
          </div>
        </div>
      </div>
    </section>

    <!-- 统计条（浮起白卡） -->
    <div class="stats">
      <div class="stats-card" v-reveal>
        <div class="stat" v-for="s in stats" :key="s.t">
          <b>{{ s.v }}</b><small>{{ s.t }}</small>
        </div>
      </div>
    </div>

    <!-- 产品线 -->
    <section class="section">
      <div class="sec-head" v-reveal>
        <div class="kicker">PRODUCTS</div>
        <h2>产品与服务</h2>
        <p>三条产品线，一站租齐</p>
      </div>
      <div class="prod-grid">
        <div class="prod-card" v-for="(p, i) in lines" :key="p.code" v-reveal="{ delay: i * 100 }"
          @click="$router.push('/products')">
          <div class="prod-visual">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
              stroke-linecap="round" stroke-linejoin="round" v-html="p.path"></svg>
          </div>
          <h3>{{ p.name }}</h3>
          <p class="desc">{{ p.desc }}</p>
          <span class="go">了解更多<i class="go-arrow">→</i></span>
        </div>
      </div>
    </section>

    <!-- 为什么选择（深色收口） -->
    <section class="section">
      <div class="why">
        <div class="why-head" v-reveal>
          <h2>把复杂留给平台<br />把简单交给客户</h2>
        </div>
        <div class="why-grid">
          <div class="why-it" v-for="(f, i) in feats" :key="f.t" v-reveal="{ delay: i * 100 }">
            <div class="w-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                stroke-linecap="round" stroke-linejoin="round" v-html="f.path"></svg>
            </div>
            <h4>{{ f.t }}</h4>
            <p>{{ f.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section cta-section">
      <div class="cta" v-reveal>
        <h3>准备好开始了吗？</h3>
        <p>注册即享一个钱包，畅享三条产品线</p>
        <button class="btn-hero primary" @click="$router.push(isLoggedIn ? '/products' : '/register')">
          {{ isLoggedIn ? '浏览商品' : '免费注册' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useUserStore } from '../store'

const ICONS = {
  storage: '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01"/><path d="M10 16h.01"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  desktop: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'
}

const LINES = [
  { code: 'storage', name: '云存储', path: ICONS.storage, desc: '对象存储 / 云硬盘 / 企业网盘，海量数据安全存。' },
  { code: 'phone', name: '云手机', path: ICONS.phone, desc: '云端安卓实例，多开群控、ADB 调试，即开即用。' },
  { code: 'desktop', name: '云电脑', path: ICONS.desktop, desc: 'Windows / Linux 云桌面，安全办公、开发上云。' }
]

const FEATS = [
  { path: ICONS.layers, t: '一站齐租', d: '三条产品线一个账号一个钱包，交叉组合满足完整业务链路。' },
  { path: ICONS.zap, t: '秒级交付', d: '资源在线即开即用，弹性伸缩，业务快速上线。' },
  { path: ICONS.shield, t: '安全合规', d: '多租户隔离、数据加密、操作审计，等保合规。' }
]

const PANEL = [
  { name: '云手机', small: '在线实例', num: '3,860', unit: '台', path: ICONS.phone },
  { name: '云电脑', small: '在线桌面', num: '1,240', unit: '台', path: ICONS.desktop },
  { name: '云存储', small: '已分配容量', num: '1.62', unit: 'PB', path: ICONS.storage }
]

const STATS = [
  { v: '3 大', t: '产品线' },
  { v: '1 个', t: '统一钱包' },
  { v: '99.95%', t: '平台可用性' },
  { v: '秒级', t: '资源开通' }
]

export default {
  name: 'HomeView',
  data() {
    return { lines: LINES, feats: FEATS, panel: PANEL, stats: STATS }
  },
  computed: {
    ...mapState(useUserStore, ['user']),
    isLoggedIn() {
      return !!this.user
    }
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
}

/* ===== Hero：深色 + 光晕 ===== */
.hero {
  margin: calc(-1 * var(--s-6)) calc(50% - 50vw) 0;
  padding: 96px 24px 120px;
  background:
    radial-gradient(1100px 520px at 78% -12%, rgba(65, 95, 255, 0.3), transparent),
    radial-gradient(800px 420px at 6% 0%, rgba(51, 214, 255, 0.16), transparent),
    var(--bg-dark);
  color: #fff;
}
.hero-grid {
  max-width: var(--wrap);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}
.hero-kicker {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--brand-weak);
  padding: 5px 14px;
  border-radius: var(--r-pill);
  margin-bottom: 20px;
}
.hero h1 {
  font-size: clamp(34px, 4.6vw, 56px);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 18px;
  color: #fff;
}
.hero h1 .grad {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero-sub {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.66);
  margin: 0 0 24px;
  max-width: 360px;
}
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
}
.hero-tags span {
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 6px 14px;
  border-radius: var(--r-pill);
  color: rgba(255, 255, 255, 0.85);
}
.hero-cta {
  display: flex;
  gap: 14px;
}
.btn-hero {
  border: 0;
  cursor: pointer;
  font-weight: 600;
  border-radius: var(--r-pill);
  padding: 14px 30px;
  font-size: 16px;
  transition: 0.22s cubic-bezier(0.22, 0.61, 0.36, 1);
  font-family: inherit;
}
.btn-hero.primary {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: var(--sh-brand);
}
.btn-hero.primary:hover {
  transform: translateY(-1px);
}
.btn-hero.ghost {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.22);
}
.btn-hero.ghost:hover {
  background: #fff;
  color: var(--ink);
  border-color: #fff;
}

/* 玻璃数据卡 */
.hero-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--r-xl);
  padding: 24px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  animation: float 6s ease-in-out infinite;
}
.hero-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hero-card .demo-tag {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 1px 8px;
  border-radius: var(--r-pill);
}
.hc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}
.hc-row:last-child {
  border-bottom: 0;
}
.hc-l {
  display: flex;
  align-items: center;
}
.hc-l .ic {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
  color: #fff;
  margin-right: 12px;
}
.hc-l .ic svg {
  width: 18px;
  height: 18px;
}
.hc-l b {
  font-size: 15px;
  font-weight: 600;
}
.hc-l small {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
.hc-num {
  font-size: 18px;
  font-weight: 700;
}
.hc-num em {
  font-style: normal;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* ===== 统计条（浮起白卡） ===== */
.stats {
  max-width: var(--wrap);
  margin: -56px auto 0;
  padding: 0 24px;
  position: relative;
  z-index: 5;
}
.stats-card {
  background: var(--bg-0);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-2);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
.stat {
  padding: 26px 24px;
  text-align: center;
  border-right: 1px solid var(--line);
}
.stat:last-child {
  border-right: 0;
}
.stat b {
  font-size: 30px;
  font-weight: 700;
  color: var(--ink);
}
.stat small {
  display: block;
  color: var(--ink-3);
  font-size: 13px;
  margin-top: 4px;
}

/* ===== 通用 section ===== */
.section {
  padding: var(--sec-pad) 0;
}
.sec-head {
  text-align: center;
  margin-bottom: 48px;
}
.sec-head .kicker {
  color: var(--brand);
  font-weight: 700;
  letter-spacing: 0.16em;
  font-size: 12px;
  text-transform: uppercase;
}
.sec-head h2 {
  font-size: clamp(26px, 3vw, 40px);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 10px 0 12px;
  color: var(--ink);
}
.sec-head p {
  color: var(--ink-3);
  font-size: 15px;
  margin: 0;
  max-width: var(--wrap-text);
  margin-left: auto;
  margin-right: auto;
}

/* ===== 产品卡片 ===== */
.prod-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.prod-card {
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 32px 28px;
  cursor: pointer;
  transition: 0.22s cubic-bezier(0.22, 0.61, 0.36, 1);
  box-shadow: var(--sh-1);
  position: relative;
}
.prod-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sh-3);
  border-color: var(--line-2);
}
.prod-visual {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--bg-2);
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  color: var(--brand);
  margin-bottom: 22px;
}
.prod-visual svg {
  width: 44px;
  height: 44px;
}
.prod-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--ink);
}
.prod-card .desc {
  color: var(--ink-3);
  font-size: 14px;
  line-height: 1.7;
  margin: 0 0 18px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.prod-card .go {
  color: var(--brand);
  font-weight: 600;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.prod-card .go .go-arrow {
  font-style: normal;
  transition: transform 0.22s;
}
.prod-card:hover .go-arrow {
  transform: translateX(4px);
}

/* ===== 为什么选择（深色收口） ===== */
.why {
  background: var(--bg-dark);
  border-radius: var(--r-xl);
  padding: 64px;
  color: #fff;
}
.why-head h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 40px;
  max-width: 420px;
}
.why-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}
.why-it .w-ic {
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  background: rgba(65, 95, 255, 0.18);
  border: 1px solid rgba(65, 95, 255, 0.4);
  display: grid;
  place-items: center;
  color: #8fb0ff;
  margin-bottom: 14px;
}
.why-it .w-ic svg {
  width: 22px;
  height: 22px;
}
.why-it h4 {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #fff;
}
.why-it p {
  color: rgba(255, 255, 255, 0.58);
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

/* ===== CTA ===== */
.cta-section {
  padding-bottom: var(--sec-pad);
}
.cta {
  text-align: center;
  padding: 64px 24px;
  background: var(--bg-2);
  border-radius: var(--r-xl);
}
.cta h3 {
  font-size: 26px;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--ink);
}
.cta p {
  color: var(--ink-3);
  font-size: 15px;
  margin: 0 0 26px;
}

/* ===== 响应式 ===== */
@media (max-width: 1000px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .prod-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .why-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .stats-card {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat:nth-child(2) {
    border-right: 0;
  }
}
@media (max-width: 560px) {
  .hero {
    padding: 64px 16px 96px;
  }
  .hero h1 {
    font-size: 32px;
  }
  .hero-cta {
    flex-direction: column;
  }
  .prod-grid {
    grid-template-columns: 1fr;
  }
  .why {
    padding: 32px 24px;
  }
  .stats-card {
    grid-template-columns: 1fr;
  }
  .stat {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .stat:last-child {
    border-bottom: 0;
  }
}
</style>
