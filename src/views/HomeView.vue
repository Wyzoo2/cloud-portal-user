<template>
  <div class="home">
    <!-- Hero：深色 + 渐变光晕 -->
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-text">
          <h1>一个平台，租遍<br /><span>云存储 · 云手机 · 云电脑</span></h1>
          <p>统一账号、统一钱包、统一门户。预充值即用，资源即开即用，像用水用电一样简单。</p>
          <div class="hero-tags">
            <span>⚡ 秒级开通</span>
            <span>💰 一个钱包畅享全线</span>
            <span>🔒 安全隔离</span>
            <span>🛠 7×24 运维</span>
          </div>
          <div class="hero-cta">
            <button class="btn-hero primary" @click="$router.push(isLoggedIn ? '/products' : '/register')">
              {{ isLoggedIn ? '浏览商品' : '免费注册' }}
            </button>
            <button v-if="!isLoggedIn" class="btn-hero ghost" @click="$router.push('/login')">登录</button>
          </div>
        </div>
        <div class="hero-card">
          <h4>实时资源看板（示例）</h4>
          <div class="hc-row" v-for="r in panel" :key="r.name">
            <div class="hc-l">
              <span class="ic" :style="{ background: r.bg }">{{ r.ic }}</span>
              <div><b>{{ r.name }}</b><small>{{ r.small }}</small></div>
            </div>
            <span class="hc-num">{{ r.num }} <em>{{ r.unit }}</em></span>
          </div>
        </div>
      </div>
    </section>

    <!-- 统计条 -->
    <div class="stats">
      <div class="stats-card">
        <div class="stat" v-for="s in stats" :key="s.t">
          <b>{{ s.v }}</b><small>{{ s.t }}</small>
        </div>
      </div>
    </div>

    <!-- 产品线 -->
    <section class="block">
      <div class="sec-head">
        <div class="kicker">PRODUCTS</div>
        <h2>三条产品线，一站租齐</h2>
        <p>一个账号一个钱包，按需组合、弹性伸缩。</p>
      </div>
      <div class="prod-grid">
        <div class="prod-card" v-for="p in lines" :key="p.code" @click="$router.push('/products')">
          <div class="prod-ic" :style="{ background: p.grad }">{{ p.ic }}</div>
          <h3>{{ p.name }}</h3>
          <div class="desc">{{ p.desc }}</div>
          <div class="from"><small>了解更多</small><span class="go">选购 →</span></div>
        </div>
      </div>
    </section>

    <!-- 为什么选 -->
    <section class="block">
      <div class="sec-head">
        <div class="kicker">WHY US</div>
        <h2>为什么选择我们</h2>
      </div>
      <div class="why">
        <div class="why-head">一站式弹性云资源平台，<br />把复杂留给平台，把简单交给客户。</div>
        <div class="why-grid">
          <div class="why-it" v-for="w in whys" :key="w.t">
            <div class="w-ic">{{ w.ic }}</div>
            <h4>{{ w.t }}</h4>
            <p>{{ w.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="block cta-block">
      <div class="cta-band">
        <div>
          <h3>准备好把资源搬上云了吗？</h3>
          <p>注册即享一个钱包，畅享三条产品线。</p>
        </div>
        <button class="cta-btn" @click="$router.push(isLoggedIn ? '/products' : '/register')">
          {{ isLoggedIn ? '浏览商品' : '免费开始' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useUserStore } from '../store'

const LINES = [
  { code: 'storage', name: '云存储', ic: '💾', grad: 'linear-gradient(135deg,#ff8a34,#ffb072)', desc: '对象存储 / 云硬盘 / 企业网盘，多副本加密、冷热分层，海量数据安全存。' },
  { code: 'phone', name: '云手机', ic: '📱', grad: 'linear-gradient(135deg,#2f6bff,#5e8dff)', desc: '云端安卓实例，独立 IP、多开群控、ADB 调试，数字员工 / 云测 / 直播矩阵利器。' },
  { code: 'desktop', name: '云电脑', ic: '🖥', grad: 'linear-gradient(135deg,#00b8d4,#4de3f0)', desc: 'Windows / Linux 云桌面，多端串流、外设重定向，安全办公、开发设计上云。' }
]

const STATS = [
  { v: '3 大', t: '产品线' },
  { v: '1 个', t: '统一钱包' },
  { v: '99.95%', t: '平台可用性' },
  { v: '秒级', t: '资源开通' }
]

const PANEL = [
  { ic: '📱', name: '云手机', small: '在线实例', num: '3,860', unit: '台', bg: 'rgba(47,107,255,.25)' },
  { ic: '🖥', name: '云电脑', small: '在线桌面', num: '1,240', unit: '台', bg: 'rgba(0,212,255,.22)' },
  { ic: '💾', name: '云存储', small: '已分配容量', num: '1.62', unit: 'PB', bg: 'rgba(255,138,52,.25)' }
]

const WHYS = [
  { ic: '🔗', t: '一站齐租', d: '三条产品线一个账号一个钱包，交叉组合满足完整业务链路。' },
  { ic: '📉', t: '成本更优', d: '统一资源池错峰调度，预充值 + 多种计费方式，更省。' },
  { ic: '🚀', t: '秒级交付', d: '资源在线即开即用，弹性伸缩，业务快速上线。' },
  { ic: '🔒', t: '安全合规', d: '多租户隔离、数据加密、操作审计，等保合规。' },
  { ic: '🌐', t: '统一门户', d: '售卖与计费统一，充值一次全线通用。' },
  { ic: '🤝', t: '贴身服务', d: '7×24 运维，明确 SLA，比大厂更懂你的业务。' }
]

export default {
  name: 'HomeView',
  data() {
    return { lines: LINES, stats: STATS, panel: PANEL, whys: WHYS }
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
  gap: var(--space-lg);
}

/* ===== Hero ===== */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(800px 420px at 82% -10%, rgba(0, 212, 255, 0.22), transparent),
    radial-gradient(720px 420px at 0% 0%, rgba(47, 107, 255, 0.4), transparent),
    var(--bg-dark);
  color: #fff;
  padding: 64px 48px 72px;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}
.hero h1 {
  font-size: 42px;
  line-height: 1.2;
  font-weight: 800;
  margin: 0 0 18px;
}
.hero h1 span {
  background: linear-gradient(90deg, #7fd4ff, #fff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero-text p {
  font-size: 16px;
  color: #c9d8f5;
  margin: 0 0 22px;
  max-width: 560px;
}
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 28px;
}
.hero-tags span {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 13px;
}
.hero-cta {
  display: flex;
  gap: 14px;
}
.btn-hero {
  border: 0;
  cursor: pointer;
  font-weight: 700;
  border-radius: 10px;
  padding: 13px 28px;
  font-size: 16px;
  transition: 0.2s;
  font-family: inherit;
}
.btn-hero.primary {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 6px 16px rgba(47, 107, 255, 0.3);
}
.btn-hero.primary:hover {
  transform: translateY(-2px);
}
.btn-hero.ghost {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.btn-hero.ghost:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* hero 浮动看板 */
.hero-card {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 20px;
  padding: 22px;
  backdrop-filter: blur(8px);
}
.hero-card h4 {
  font-size: 14px;
  color: #9fc0f0;
  margin: 0 0 12px;
  font-weight: 600;
}
.hc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
}
.hc-row:last-child {
  border: 0;
}
.hc-l {
  display: flex;
  align-items: center;
}
.hc-l .ic {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-size: 18px;
  margin-right: 12px;
}
.hc-l b {
  font-size: 15px;
}
.hc-l small {
  display: block;
  color: #9fc0f0;
  font-size: 12px;
}
.hc-num {
  font-weight: 800;
  font-size: 16px;
}
.hc-num em {
  font-style: normal;
  color: #7fe0a8;
  font-size: 12px;
  font-weight: 600;
}

/* ===== 统计条 ===== */
.stats {
  margin-top: -34px;
  position: relative;
  z-index: 5;
  padding: 0 8px;
}
.stats-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 10px;
}
.stat {
  padding: 22px 24px;
  text-align: center;
  border-right: 1px solid var(--line, var(--border));
}
.stat:last-child {
  border: 0;
}
.stat b {
  font-size: 28px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.stat small {
  display: block;
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 4px;
}

/* ===== 通用 section ===== */
.block {
  padding: 24px 0;
}
.sec-head {
  text-align: center;
  margin-bottom: 36px;
}
.sec-head .kicker {
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 3px;
  font-size: 13px;
}
.sec-head h2 {
  font-size: 30px;
  font-weight: 800;
  margin: 8px 0 12px;
}
.sec-head p {
  color: var(--text-secondary);
  max-width: 640px;
  margin: 0 auto;
}

/* ===== 产品卡片 ===== */
.prod-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.prod-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 28px 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  transition: 0.25s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.prod-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}
.prod-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent-gradient);
}
.prod-ic {
  width: 56px;
  height: 56px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  font-size: 27px;
  margin-bottom: 18px;
  color: #fff;
}
.prod-card h3 {
  font-size: 20px;
  margin: 0 0 8px;
}
.prod-card .desc {
  color: var(--text-secondary);
  font-size: 14px;
  min-height: 66px;
  line-height: 1.6;
}
.prod-card .from {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.prod-card .from small {
  color: var(--text-secondary);
}
.prod-card .go {
  color: var(--accent);
  font-weight: 700;
  font-size: 13px;
}

/* ===== 为什么选 ===== */
.why {
  background: linear-gradient(160deg, #0b1535, #142a5c);
  color: #fff;
  border-radius: var(--radius-lg);
  padding: 48px;
}
.why-head {
  font-size: 22px;
  font-weight: 800;
  max-width: 420px;
  margin-bottom: 8px;
}
.why-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-top: 28px;
}
.why-it h4 {
  font-size: 17px;
  margin: 12px 0 8px;
}
.why-it p {
  color: #b9cbee;
  font-size: 14px;
  line-height: 1.6;
}
.why-it .w-ic {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: rgba(0, 212, 255, 0.15);
  display: grid;
  place-items: center;
  font-size: 23px;
}

/* ===== CTA ===== */
.cta-block {
  padding-bottom: 12px;
}
.cta-band {
  background: var(--accent-gradient);
  border-radius: var(--radius-lg);
  padding: 44px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.cta-band h3 {
  font-size: 24px;
  margin: 0;
}
.cta-band p {
  opacity: 0.9;
  margin: 6px 0 0;
}
.cta-btn {
  background: #fff;
  color: var(--accent);
  border: 0;
  cursor: pointer;
  font-weight: 700;
  padding: 13px 30px;
  font-size: 16px;
  border-radius: 10px;
  transition: 0.2s;
  font-family: inherit;
}
.cta-btn:hover {
  transform: translateY(-2px);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .hero {
    padding: 40px 24px 56px;
  }
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .hero h1 {
    font-size: 30px;
  }
  .prod-grid {
    grid-template-columns: 1fr;
  }
  .stats-card {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat:nth-child(2) {
    border-right: 0;
  }
  .stat {
    padding: 18px 12px;
  }
  .why {
    padding: 32px 24px;
  }
  .why-grid {
    grid-template-columns: 1fr;
  }
  .sec-head h2 {
    font-size: 24px;
  }
  .cta-band {
    padding: 32px 24px;
  }
}
</style>
