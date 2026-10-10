<template>
  <div class="recharge">
    <!-- 流程说明 -->
    <div class="steps-card" v-reveal>
      <div class="steps-title">充值不是即时到账，请按以下流程操作</div>
      <div class="steps">
        <div class="step" v-for="(s, i) in steps" :key="i">
          <div class="s-num">{{ i + 1 }}</div>
          <div class="s-body"><b>{{ s.t }}</b><small>{{ s.d }}</small></div>
        </div>
      </div>
    </div>

    <!-- 表单 -->
    <div class="form-card" v-reveal="{ delay: 100 }">
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

    <!-- 提交成功 -->
    <div v-if="result" class="result">
      <el-alert type="success" :closable="false" show-icon :title="result.notice || '申请已提交'" />
      <div class="result-actions">
        <el-button type="primary" @click="$router.push('/wallet/recharges')">查看充值记录</el-button>
        <el-button @click="$router.push('/wallet')">返回钱包</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { api } from '../api'
import { toastError } from '../utils/errors'
import { AmountInput } from '../components'

export default {
  name: 'RechargeView',
  components: { AmountInput },
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
.recharge {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  max-width: 640px;
}
.steps-card,
.form-card {
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 24px;
}
.steps-title {
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--warning);
}
.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.step {
  display: flex;
  gap: 10px;
}
.s-num {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.s-body b {
  font-size: 14px;
  display: block;
}
.s-body small {
  color: var(--ink-3);
  font-size: 12px;
  line-height: 1.5;
}
.field {
  margin-bottom: var(--s-4);
}
.field-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-3);
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
}
.result-actions {
  display: flex;
  gap: var(--s-2);
}
@media (max-width: 1000px) {
  .steps {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
