<template>
  <div class="recharge">
    <PageBand
      :crumb="[{ text: '首页', to: '/' }, { text: '账户中心', to: '/account' }, { text: '充值申请' }]"
      title="充值申请"
      desc="平台不走在线支付：提交申请后请线下转账，管理员核对到账后余额自动入账——不是即时到账。"
    >
      <template #side>
        <div class="band-stat">
          <b class="figure">¥1 ~ ¥10万</b>
          <span>单笔金额范围</span>
        </div>
      </template>
    </PageBand>

    <div class="body">
      <!-- 流程说明 -->
      <Panel title="充值流程">
        <div class="steps">
          <div class="step" v-for="(s, i) in steps" :key="i">
            <div class="s-num figure">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="s-body"><b>{{ s.t }}</b><small>{{ s.d }}</small></div>
          </div>
        </div>
      </Panel>

      <!-- 表单 -->
      <Panel class="mt" title="提交申请" small="金额与备注会一并提交给管理员核对">
        <div class="form-body">
          <div class="field">
            <div class="field-label">充值金额（元）</div>
            <AmountInput v-model="amount_cents" placeholder="请输入充值金额（¥1 ~ ¥100,000）" />
            <div class="field-tip">单笔 ¥1 ~ ¥100,000</div>
          </div>
          <div class="field">
            <div class="field-label">转账备注（选填）</div>
            <el-input v-model="remark" type="textarea" :rows="3" maxlength="200" show-word-limit
              placeholder="如：微信转账，尾号 1234，便于管理员核对" />
          </div>
          <el-button class="submit" type="primary" size="large" :loading="loading" @click="submit">
            提交充值申请
          </el-button>
        </div>
      </Panel>

      <!-- 提交成功 -->
      <Panel v-if="result" class="mt" title="申请已提交">
        <div class="result">
          <el-alert type="success" :closable="false" show-icon :title="result.notice || '申请已提交'" />
          <div class="result-actions">
            <el-button type="primary" @click="$router.push('/wallet/recharges')">查看充值记录</el-button>
            <el-button @click="$router.push('/account')">返回账户中心</el-button>
          </div>
        </div>
      </Panel>
    </div>

    <SiteFooter
      statement="提交后请尽快完成线下转账，管理员核销后余额自动入账。"
      action-text="查看充值记录"
      action-to="/wallet/recharges"
    />
  </div>
</template>

<script>
// ElMessage 由 unplugin-auto-import 按需注入（见 vite.config.js）
import { api } from '../api'
import { toastError } from '../utils/errors'
import { AmountInput, PageBand, Panel, SiteFooter } from '../components'

export default {
  name: 'RechargeView',
  components: { AmountInput, PageBand, Panel, SiteFooter },
  data() {
    return {
      amount_cents: null,
      remark: '',
      loading: false,
      result: null,
      steps: [
        { t: '提交申请', d: '在本页填写金额并提交' },
        { t: '线下转账', d: '向平台指定账户转账' },
        { t: '管理员核销', d: '平台人工核对到账' },
        { t: '余额到账', d: '核销通过后自动入账' }
      ]
    }
  },
  methods: {
    async submit() {
      if (this.loading) return // 函数级防重（按钮 loading 只是视觉兜底）
      const amt = Number(this.amount_cents)
      if (this.amount_cents == null || this.amount_cents === '' || Number.isNaN(amt)) {
        ElMessage.warning('请输入充值金额')
        return
      }
      if (amt < 100) {
        ElMessage.warning('单笔最低充值 ¥1')
        return
      }
      if (amt > 10000000) {
        ElMessage.warning('单笔最高充值 ¥100,000')
        return
      }
      this.loading = true
      try {
        this.result = await api.rechargeApply(amt, this.remark)
        this.amount_cents = null
        this.remark = ''
      } catch (e) {
        toastError(e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
/* 通栏内容区（首页格式）：背景铺满屏幕，内容居中（表单页窄一些更好读） */
.body {
  background: var(--bg-1);
  padding: var(--s-7) var(--s-6) var(--s-11);
}
.body > * {
  max-width: 860px;
  margin-left: auto;
  margin-right: auto;
}
.body > * + * {
  margin-top: var(--s-5);
}
.mt {
  margin-top: var(--s-5);
}
.band-stat {
  text-align: right;
}
.band-stat b {
  display: block;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.band-stat span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}
.steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s-5);
  padding: 22px var(--s-6);
}
.step {
  display: flex;
  gap: 12px;
}
.s-num {
  font-size: 20px;
  color: #b3c0f2;
  flex-shrink: 0;
  line-height: 1.3;
}
.s-body b {
  font-size: 14px;
  display: block;
}
.s-body small {
  color: var(--ink-3);
  font-size: 12px;
  line-height: 1.6;
}
.form-body {
  padding: 22px var(--s-6);
}
.field {
  margin-bottom: var(--s-4);
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  margin-bottom: 8px;
}
.field-tip {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 6px;
}
.submit {
  width: 100%;
}
.result {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: 22px var(--s-6);
}
.result-actions {
  display: flex;
  gap: var(--s-2);
}
@media (max-width: 768px) {
  .body {
    padding: var(--s-4) var(--s-3) var(--s-10);
  }
  .steps {
    grid-template-columns: 1fr;
    padding: 18px var(--s-4);
  }
  .form-body,
  .result {
    padding: 18px var(--s-4);
  }
}
</style>
