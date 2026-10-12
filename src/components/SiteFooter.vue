<template>
  <footer class="foot">
    <!-- 收尾带：一句陈述 + 一个动作（不传 statement 就只显示页脚） -->
    <div v-if="statement" class="closing">
      <div class="wrap closing-in">
        <p class="statement">{{ statement }}</p>
        <router-link v-if="actionText && actionTo" class="action" :to="actionTo">
          {{ actionText }}
        </router-link>
      </div>
    </div>

    <!-- 页脚主体 -->
    <div class="wrap main">
      <div class="brand">
        <span class="mark"></span>
        <div class="brand-text">
          <b>云平台统一门户</b>
          <small>一个账号 · 一个钱包 · 三条产品线</small>
        </div>
      </div>

      <nav class="links">
        <router-link v-for="m in menu" :key="m.path" :to="m.path">{{ m.label }}</router-link>
        <router-link to="/wallet/recharge">充值</router-link>
        <router-link to="/wallet/transactions">消费流水</router-link>
      </nav>
    </div>

    <div class="wrap note">
      内网测试环境 · 充值走线下转账与人工核销 · 开通结果与退款去向以订单详情为准
    </div>
  </footer>
</template>

<script>
import { APP_MENU } from '../utils/constants'

export default {
  name: 'SiteFooter',
  props: {
    // 收尾带文案；留空则只渲染页脚
    statement: { type: String, default: '' },
    // 收尾带右侧动作
    actionText: { type: String, default: '' },
    actionTo: { type: [String, Object], default: '' }
  },
  data() {
    return { menu: APP_MENU }
  }
}
</script>

<style scoped>
/* 全站统一收尾：深色带（与首页首屏同一套深色 token），通栏铺满 */
.foot {
  background: var(--bg-dark);
  color: #fff;
  margin-top: auto;
}
.wrap {
  width: 100%;
  max-width: var(--wrap-app);
  margin: 0 auto;
  padding: 0 var(--s-6);
}

/* 收尾带：陈述 + 动作 */
.closing {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.closing-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding-top: 40px;
  padding-bottom: 40px;
}
.statement {
  margin: 0;
  font-size: 20px;
  line-height: 1.6;
  letter-spacing: -0.01em;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  max-width: 760px;
}
.action {
  flex-shrink: 0;
  height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 24px;
  border-radius: var(--r-md);
  background: var(--brand);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}
.action:hover {
  background: var(--brand-hover);
}

/* 页脚主体 */
.main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding-top: 32px;
  padding-bottom: 24px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mark {
  width: 28px;
  height: 28px;
  border-radius: var(--r-md);
  background: var(--accent-gradient);
  display: block;
  flex-shrink: 0;
}
.brand-text b {
  display: block;
  font-size: 15px;
  font-weight: 600;
}
.brand-text small {
  display: block;
  margin-top: 2px;
  font-size: var(--font-xs);
  color: rgba(255, 255, 255, 0.5);
}
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  font-size: var(--font-sm);
}
.links a {
  color: rgba(255, 255, 255, 0.6);
}
.links a:hover {
  color: #fff;
}
.note {
  padding-top: 20px;
  padding-bottom: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: var(--font-xs);
  color: rgba(255, 255, 255, 0.42);
}

@media (max-width: 768px) {
  .wrap {
    padding: 0 var(--s-4);
  }
  .closing-in {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding-top: 28px;
    padding-bottom: 28px;
  }
  .statement {
    font-size: 16px;
  }
  .main {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  .links {
    gap: 18px;
  }
}
</style>
