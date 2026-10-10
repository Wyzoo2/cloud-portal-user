<template>
  <div class="home">
    <!-- Hero：浅色 + 大标题 -->
    <section class="hero">
      <div class="hero-inner" v-reveal>
        <h1>云平台统一门户</h1>
        <p class="hero-sub">一个账号、一个钱包，畅享云存储 / 云手机 / 云电脑</p>
        <div class="hero-cta">
          <button class="btn-hero primary" @click="$router.push(isLoggedIn ? '/products' : '/register')">
            {{ isLoggedIn ? '浏览商品' : '立即开始' }}
          </button>
          <button class="btn-hero ghost" @click="$router.push('/products')">了解产品</button>
        </div>
      </div>
    </section>

    <!-- 产品线 -->
    <section class="section">
      <div class="sec-head" v-reveal>
        <h2>产品与服务</h2>
        <p>三条产品线，一站租齐</p>
      </div>
      <div class="prod-grid">
        <div class="prod-card" v-for="(p, i) in lines" :key="p.code" v-reveal="{ delay: i * 100 }" @click="$router.push('/products')">
          <div class="prod-ic" :style="{ background: p.bg }">{{ p.ic }}</div>
          <h3>{{ p.name }}</h3>
          <p class="desc">{{ p.desc }}</p>
          <span class="go">了解更多 →</span>
        </div>
      </div>
    </section>

    <!-- 卖点 -->
    <section class="section features">
      <div class="sec-head" v-reveal>
        <h2>为什么选择我们</h2>
      </div>
      <div class="feat-grid">
        <div class="feat" v-for="(f, i) in feats" :key="f.t" v-reveal="{ delay: i * 100 }">
          <div class="f-ic">{{ f.ic }}</div>
          <h4>{{ f.t }}</h4>
          <p>{{ f.d }}</p>
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

const LINES = [
  { code: 'storage', name: '云存储', ic: '💾', bg: '#eef1ff', desc: '对象存储 / 云硬盘 / 企业网盘，海量数据安全存。' },
  { code: 'phone', name: '云手机', ic: '📱', bg: '#e8f6ff', desc: '云端安卓实例，多开群控、ADB 调试，即开即用。' },
  { code: 'desktop', name: '云电脑', ic: '🖥', bg: '#f0fbf7', desc: 'Windows / Linux 云桌面，安全办公、开发上云。' }
]

const FEATS = [
  { ic: '🔗', t: '一站齐租', d: '三条产品线一个账号一个钱包，交叉组合满足完整业务链路。' },
  { ic: '🚀', t: '秒级交付', d: '资源在线即开即用，弹性伸缩，业务快速上线。' },
  { ic: '🔒', t: '安全合规', d: '多租户隔离、数据加密、操作审计，等保合规。' }
]

export default {
  name: 'HomeView',
  data() {
    return { lines: LINES, feats: FEATS }
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

/* ===== Hero ===== */
.hero {
  padding: 88px 24px 72px;
  text-align: center;
}
.hero h1 {
  font-size: 48px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -1px;
  margin: 0 0 20px;
  color: var(--text-primary);
}
.hero-sub {
  font-size: 19px;
  color: var(--text-secondary);
  margin: 0 0 36px;
}
.hero-cta {
  display: flex;
  gap: 14px;
  justify-content: center;
}
.btn-hero {
  border: 0;
  cursor: pointer;
  font-weight: 600;
  border-radius: 24px;
  padding: 14px 34px;
  font-size: 16px;
  transition: 0.25s;
  font-family: inherit;
}
.btn-hero.primary {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 8px 20px rgba(65, 95, 255, 0.25);
}
.btn-hero.primary:hover {
  background: var(--accent-dark, #344ccc);
  transform: translateY(-2px);
}
.btn-hero.ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-hero.ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* ===== 通用 section ===== */
.section {
  padding: 40px 0;
}
.sec-head {
  text-align: center;
  margin-bottom: 44px;
}
.sec-head h2 {
  font-size: 34px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin: 0 0 10px;
}
.sec-head p {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0;
}

/* ===== 产品卡片 ===== */
.prod-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.prod-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}
.prod-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}
.prod-ic {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 32px;
  margin-bottom: 24px;
}
.prod-card h3 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 10px;
}
.prod-card .desc {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
  margin: 0 0 20px;
  min-height: 48px;
}
.prod-card .go {
  color: var(--accent);
  font-weight: 600;
  font-size: 14px;
}

/* ===== 卖点 ===== */
.features {
  background: var(--bg-card);
}
.feat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}
.feat .f-ic {
  font-size: 40px;
  margin-bottom: 18px;
}
.feat h4 {
  font-size: 19px;
  font-weight: 600;
  margin: 0 0 10px;
}
.feat p {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
  margin: 0;
}

/* ===== CTA ===== */
.cta-section {
  padding-bottom: 48px;
}
.cta {
  text-align: center;
  padding: 56px 24px;
  background: linear-gradient(135deg, #f3f5ff, #f7f8ff);
  border-radius: var(--radius-lg);
}
.cta h3 {
  font-size: 30px;
  font-weight: 600;
  margin: 0 0 12px;
}
.cta p {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0 0 28px;
}

@media (max-width: 768px) {
  .hero {
    padding: 56px 16px 48px;
  }
  .hero h1 {
    font-size: 32px;
  }
  .hero-sub {
    font-size: 16px;
  }
  .prod-grid {
    grid-template-columns: 1fr;
  }
  .feat-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .sec-head h2 {
    font-size: 26px;
  }
}
</style>
