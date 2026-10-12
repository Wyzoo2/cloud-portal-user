<template>
  <div class="home">
    <!-- ════════ 首屏深色带（B 方案）：页头透明压在上面 ════════ -->
    <section class="hero-band">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="wrap hero">
        <div class="hero-copy">
          <span class="eyebrow">CLOUD PORTAL · 统一账号 · 统一钱包</span>
          <h1>
            三条产品线，<br />
            <em>一份余额</em>，一次结清。
          </h1>
          <p>
            云存储、云手机、云电脑共用同一个账号与钱包。下单即开通、开通失败自动退款，
            每一笔消费都有流水可查。
          </p>
          <div class="hero-cta">
            <button class="btn-primary" @click="$router.push('/products')">立即选购</button>
            <button class="btn-ghost" @click="$router.push(isLoggedIn ? '/wallet/transactions' : '/register')">
              查看消费流水
            </button>
          </div>
          <ul class="hero-tags">
            <li>秒级开通</li>
            <li>一个钱包</li>
            <li>失败自动退款</li>
          </ul>
        </div>

        <!-- 玻璃卡：已登录展示真实余额，游客展示统一钱包说明（不编数据） -->
        <aside class="glass" v-reveal>
          <template v-if="isLoggedIn">
            <div class="glass-label">账户余额</div>
            <div class="glass-amount"><AmountText :cents="balanceCents" /></div>
            <div class="glass-rows">
              <div><span>钱包状态</span><b :class="{ danger: isFrozen }">{{ isFrozen ? '已冻结' : '正常' }}</b></div>
              <div><span>可用产品线</span><b>3 条</b></div>
            </div>
            <button class="glass-btn" @click="$router.push('/wallet')">进入钱包</button>
          </template>
          <template v-else>
            <div class="glass-label">统一钱包</div>
            <div class="glass-amount">一个账号<br />一份余额</div>
            <div class="glass-rows">
              <div><span>云存储</span><b>对象存储 / 文件备份</b></div>
              <div><span>云手机</span><b>云端安卓实例</b></div>
              <div><span>云电脑</span><b>Windows / Linux 桌面</b></div>
            </div>
            <button class="glass-btn" @click="$router.push('/register')">注册并开通钱包</button>
          </template>
        </aside>
      </div>
    </section>

    <!-- ════════ 关键指标（压在深浅交界） ════════ -->
    <div class="wrap kpis">
      <div v-for="(k, i) in kpis" :key="k.label" class="kpi" v-reveal="{ delay: i * 60 }">
        <b class="figure">{{ k.value }}</b>
        <span>{{ k.label }}</span>
      </div>
    </div>

    <!-- ════════ 产品与服务 ════════ -->
    <section class="wrap sec">
      <header class="sec-head" v-reveal>
        <div class="tag">Products</div>
        <h2>产品与服务</h2>
        <p>三条产品线一站租齐，规格与价格实时同步自各产品，下单时按实时价重算</p>
      </header>
      <div class="cards">
        <article v-for="(p, i) in lines" :key="p.code" class="pcard" v-reveal="{ delay: i * 80 }">
          <span class="picon" v-html="p.icon"></span>
          <h3>{{ p.name }}</h3>
          <p class="pdesc">{{ p.desc }}</p>
          <ul class="plist">
            <li v-for="f in p.feats" :key="f">{{ f }}</li>
          </ul>
          <button class="plink" @click="$router.push(`/products?product_code=${p.code}`)">
            查看规格与价格
          </button>
        </article>
      </div>
    </section>

    <!-- ════════ 充值流程（线下转账 + 人工核销，必须讲清） ════════ -->
    <section class="wrap sec">
      <header class="sec-head" v-reveal>
        <div class="tag">Recharge</div>
        <h2>充值不是即时到账</h2>
        <p>平台不走在线支付：提交申请后请线下转账，管理员核对到账后余额自动入账</p>
      </header>
      <ol class="steps">
        <li v-for="(s, i) in steps" :key="s.t" v-reveal="{ delay: i * 70 }">
          <span class="step-no figure">{{ String(i + 1).padStart(2, '0') }}</span>
          <b>{{ s.t }}</b>
          <small>{{ s.d }}</small>
        </li>
      </ol>
    </section>

    <!-- ════════ 深色能力带 ════════ -->
    <section class="dark-band">
      <div class="wrap">
        <h2>把复杂留给平台，把简单交给客户</h2>
        <div class="feats">
          <div v-for="(f, i) in feats" :key="f.t" class="feat" v-reveal="{ delay: i * 70 }">
            <span class="ficon" v-html="f.icon"></span>
            <b>{{ f.t }}</b>
            <p>{{ f.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════ 收尾：深色收尾带 + 页脚（与内页共用同一个组件） ════════ -->
    <SiteFooter
      :statement="isLoggedIn ? '账户已就绪，随时可以开通云存储 / 云手机 / 云电脑。' : '注册即拥有一个钱包，云存储 / 云手机 / 云电脑随时开通。'"
      :action-text="isLoggedIn ? '去选购' : '免费注册'"
      :action-to="isLoggedIn ? '/products' : '/register'"
    />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useUserStore } from '../store'
import AmountText from '../components/AmountText.vue'
import SiteFooter from '../components/SiteFooter.vue'

const ICONS = {
  storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 16.5 12 21l9-4.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  desktop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M9 20h6M12 16.5V20"/></svg>',
  plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><path d="M5 8h14v4a7 7 0 0 1-14 0Z"/><path d="M12 19v3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3"/><path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3.5"/><path d="M21 9.5h-4.5a2 2 0 0 0 0 4H21Z"/></svg>'
}

export default {
  name: 'HomeView',
  components: { AmountText, SiteFooter },
  data() {
    return {
      kpis: [
        { value: '3', label: '产品线统一接入' },
        { value: '1', label: '账号与钱包' },
        { value: '15s', label: '下单到可用（典型）' },
        { value: '7×24', label: '实例在线运行' }
      ],
      lines: [
        {
          code: 'storage',
          name: '云存储',
          icon: ICONS.storage,
          desc: '对象存储与文件备份，容量按需购买，适合数据留存与共享。',
          feats: ['容量与地域按规格选择', '下单后实例与到期时间可见', '开通失败自动退款']
        },
        {
          code: 'phone',
          name: '云手机',
          icon: ICONS.phone,
          desc: '云端安卓实例，多开群控、调试即开即用，不占用本地设备。',
          feats: ['标准版 2 核 2G 起', '单项最多购买 3 台', '独立 IP']
        },
        {
          code: 'desktop',
          name: '云电脑',
          icon: ICONS.desktop,
          desc: 'Windows / Linux 云桌面，办公与开发环境开箱可用。',
          feats: ['办公型 4 核 8G 起', '系统盘随实例分配', '包周期或按量计费']
        }
      ],
      steps: [
        { t: '提交申请', d: '在钱包页填写充值金额并提交' },
        { t: '线下转账', d: '按平台提供的账户完成转账' },
        { t: '管理员核销', d: '平台人工核对到账金额与备注' },
        { t: '余额到账', d: '核销通过后余额自动入账并生成流水' }
      ],
      feats: [
        { t: '一站租齐', d: '三条产品线一个账号一个钱包，交叉组合满足完整业务链路。', icon: ICONS.wallet },
        { t: '秒级交付', d: '资源在线下单即开通，开通进度与结果在订单详情里按项展示。', icon: ICONS.plug },
        { t: '安全合规', d: '多租户隔离、数据加密、操作审计，账户与钱包状态全程可查。', icon: ICONS.shield }
      ]
    }
  },
  computed: {
    ...mapState(useUserStore, ['user', 'balance', 'isFrozen']),
    isLoggedIn() {
      return !!this.user
    },
    balanceCents() {
      return this.balance ? this.balance.balance_cents : null
    }
  }
}
</script>

<style scoped>
.home {
  display: block;
}

/* ════════ 深色带 ════════ */
.hero-band {
  position: relative;
  overflow: hidden;
  background: var(--bg-dark);
  /* 上移一个页头高度，让深色带钻到透明页头下面 */
  margin-top: calc(var(--header-h) * -1);
  padding-top: calc(var(--header-h) + 64px);
  padding-bottom: 96px;
  color: #fff;
}
/* 品牌光晕 + 细网格，制造"大气"的深色质感 */
.hero-band::after {
  content: "";
  position: absolute;
  width: 1000px;
  height: 560px;
  right: -160px;
  top: -240px;
  background: radial-gradient(closest-side, rgba(29, 59, 214, 0.55), transparent 70%);
  pointer-events: none;
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: radial-gradient(120% 90% at 70% 0%, #000 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(120% 90% at 70% 0%, #000 30%, transparent 75%);
  pointer-events: none;
}
.wrap {
  width: 100%;
  max-width: var(--wrap);
  margin: 0 auto;
  padding: 0 32px;
  position: relative;
  z-index: 2;
}
.hero {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 56px;
  align-items: center;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 14px;
  border-radius: var(--r-pill);
  background: var(--glass-bg);
  border: 1px solid var(--dark-line);
  font-size: var(--font-xs);
  letter-spacing: 0.1em;
  color: #c9d3ff;
}
.hero h1 {
  margin: 22px 0 0;
  font-size: var(--font-hero);
  line-height: 1.12;
  letter-spacing: -0.03em;
  font-weight: 600;
  text-wrap: balance; /* 关键词不被折断 */
}
.hero h1 em {
  font-style: normal;
  background: var(--accent-gradient-soft);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero p {
  margin-top: 20px;
  max-width: 520px;
  font-size: var(--font-md);
  line-height: 1.8;
  color: var(--dark-ink);
}
.hero-cta {
  margin-top: 34px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.btn-primary {
  height: 48px;
  padding: 0 26px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--brand);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: var(--brand-hover);
}
.btn-ghost {
  height: 48px;
  padding: 0 24px;
  border-radius: var(--r-md);
  border: 1px solid var(--dark-line);
  background: transparent;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s;
}
.btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.4);
}
.hero-tags {
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.hero-tags li {
  font-size: var(--font-xs);
  color: var(--dark-ink-2);
  border: 1px solid var(--dark-line);
  border-radius: var(--r-pill);
  padding: 4px 12px;
}

/* 玻璃卡 */
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--dark-line);
  border-radius: var(--r-xl);
  padding: 28px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.glass-label {
  font-size: var(--font-sm);
  color: var(--dark-ink-2);
}
.glass-amount {
  margin-top: 10px;
  font-size: 40px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.glass-rows {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: var(--font-sm);
  color: var(--dark-ink);
}
.glass-rows div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.glass-rows b {
  color: #fff;
  font-weight: 600;
  text-align: right;
}
.glass-rows b.danger {
  color: #ff8a9b;
}
.glass-btn {
  margin-top: 22px;
  width: 100%;
  height: 44px;
  border-radius: var(--r-md);
  border: 1px solid var(--dark-line);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.glass-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* ════════ KPI（压在深浅交界） ════════ */
.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: -46px;
}
.kpi {
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 24px;
  box-shadow: var(--sh-float);
}
.kpi b {
  display: block;
  font-size: 28px;
}
.kpi span {
  display: block;
  margin-top: 6px;
  font-size: var(--font-sm);
  color: var(--ink-3);
}

/* ════════ 分节（A 语汇：小标签 + 大标题 + 分割线） ════════ */
.sec {
  padding: var(--sec-pad) 0;
}
/* 相邻两节之间不要叠两份留白 */
.sec + .sec {
  padding-top: 32px;
}
.sec-head {
  padding-bottom: 20px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--line);
}
.sec-head .tag {
  font-size: var(--font-xs);
  letter-spacing: 0.18em;
  color: var(--brand);
  text-transform: uppercase;
}
.sec-head h2 {
  margin: 10px 0 0;
  font-size: var(--font-2xl);
  letter-spacing: -0.02em;
  font-weight: 600;
}
.sec-head p {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--ink-3);
}

/* 产品卡：发丝线、无投影（内页语汇），hover 只换边框颜色 */
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.pcard {
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 28px 26px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s;
}
.pcard:hover {
  border-color: var(--brand-weak-2);
}
.picon {
  width: 46px;
  height: 46px;
  border-radius: var(--r-md);
  background: var(--brand-weak);
  color: var(--brand);
  display: grid;
  place-items: center;
}
.picon :deep(svg) {
  width: 24px;
  height: 24px;
}
.pcard h3 {
  margin: 20px 0 0;
  font-size: var(--font-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
}
.pdesc {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--ink-2);
}
.plist {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.plist li {
  position: relative;
  padding-left: 16px;
  font-size: var(--font-sm);
  color: var(--ink-3);
}
.plist li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brand-weak-2);
}
.plink {
  margin-top: auto;
  padding-top: 22px;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--brand);
  cursor: pointer;
}

/* 充值流程 */
.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.steps li {
  background: var(--bg-0);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.step-no {
  font-size: 22px;
  color: #b3c0f2; /* 装饰性序号：比 brand-weak-2 深一档，白底上更清晰 */
}
.steps b {
  font-size: var(--font-base);
  font-weight: 600;
}
.steps small {
  font-size: var(--font-sm);
  color: var(--ink-3);
  line-height: 1.7;
}

/* ════════ 深色能力带 ════════ */
.dark-band {
  background: var(--bg-dark);
  color: #fff;
  padding: var(--sec-pad) 0;
}
.dark-band h2 {
  margin: 0 0 40px;
  font-size: var(--font-2xl);
  letter-spacing: -0.02em;
  font-weight: 600;
}
.feats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}
.feat b {
  display: block;
  margin-top: 18px;
  font-size: var(--font-md);
  font-weight: 600;
}
.feat p {
  margin: 10px 0 0;
  font-size: var(--font-sm);
  line-height: 1.8;
  color: var(--dark-ink);
}
.ficon {
  width: 42px;
  height: 42px;
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--dark-line);
  color: #b9c6ff;
  display: grid;
  place-items: center;
}
.ficon :deep(svg) {
  width: 22px;
  height: 22px;
}

/* 收尾带与页脚由 SiteFooter 组件提供，这里不再重复实现 */

/* ── 移动端 ── */
@media (max-width: 1000px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .kpis,
  .cards,
  .steps,
  .feats {
    grid-template-columns: repeat(2, 1fr);
  }
  .feats {
    gap: 28px;
  }
}
@media (max-width: 768px) {
  .hero-band {
    padding-top: calc(var(--header-h) + 40px);
    padding-bottom: 72px;
  }
  .wrap {
    padding: 0 20px;
  }
  .kpis {
    margin-top: -32px;
    gap: 12px;
  }
  .kpi {
    padding: 18px;
  }
  .kpi b {
    font-size: 22px;
  }
  .cards,
  .steps,
  .feats {
    grid-template-columns: 1fr;
  }
  .glass {
    padding: 22px;
  }
  .glass-amount {
    font-size: 32px;
  }
}
</style>
