<template>
  <!-- 企业注册：右侧抽屉（流程①）
       必填 5 项 + 选填折叠，成功后原地换成等审核结果 -->
  <el-drawer
    v-model="visible"
    direction="rtl"
    :size="drawerSize"
    :with-header="false"
    :append-to-body="true"
    class="ent-drawer"
  >
    <div class="wrap">
      <header class="head">
        <div>
          <div class="topic">
            <span class="mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
            </span>
            企业版
          </div>
          <h2>企业注册</h2>
          <p>企业与管理员账号一并创建，平台审核通过后可用</p>
        </div>
        <button class="close" type="button" aria-label="关闭" @click="visible = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <!-- 提交成功：只讲下一步 -->
      <section v-if="submitted" class="done">
        <span class="done-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
            stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5" /></svg>
        </span>
        <h3>注册已提交</h3>
        <p class="muted">
          企业「{{ submitted.name }}」与管理员账号「{{ submitted.admin_username }}」已创建，等待平台审核。
        </p>
        <el-alert
          class="notice"
          type="warning"
          :closable="false"
          show-icon
          title="审核通过后即可登录"
          description="用该管理员账号从「企业员工」入口登录，再创建企业成员。"
        />
        <el-button class="submit" type="primary" size="large" @click="goEnterpriseLogin">
          去企业员工登录
        </el-button>
      </section>

      <!-- 表单 -->
      <el-form
        v-else
        ref="entRef"
        :model="ent"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item prop="code" label="企业编码">
          <el-input v-model="ent.code" placeholder="唯一编码，如 acme" clearable />
        </el-form-item>
        <el-form-item prop="name" label="企业名称">
          <el-input v-model="ent.name" placeholder="营业执照上的名称" clearable />
        </el-form-item>
        <el-form-item prop="admin_username" label="管理员登录账号">
          <el-input v-model="ent.admin_username" placeholder="4-32 位字母、数字或下划线" clearable />
        </el-form-item>
        <el-form-item prop="admin_password" label="管理员密码">
          <el-input v-model="ent.admin_password" type="password" placeholder="8-64 位，需含字母和数字" show-password />
        </el-form-item>
        <el-form-item prop="admin_confirm" label="确认管理员密码">
          <el-input v-model="ent.admin_confirm" type="password" placeholder="请再次输入" show-password />
        </el-form-item>

        <el-collapse class="more">
          <el-collapse-item title="更多信息（选填）" name="more">
            <el-form-item prop="contact_name">
              <el-input v-model="ent.contact_name" placeholder="联系人" clearable />
            </el-form-item>
            <el-form-item prop="contact_phone">
              <el-input v-model="ent.contact_phone" placeholder="联系电话" clearable />
            </el-form-item>
            <el-form-item prop="remark">
              <el-input v-model="ent.remark" type="textarea" :rows="2" placeholder="备注（便于平台审核）" maxlength="200" show-word-limit />
            </el-form-item>
          </el-collapse-item>
        </el-collapse>

        <p class="hint">
          企业账号与个人账号共用一套命名空间；管理员账号被占用时需换一个。
          提交后企业状态为「待审核」，审核通过前无法登录。
        </p>

        <div v-if="error.items.length" class="alerts">
          <el-alert
            v-for="(msg, i) in error.items"
            :key="i"
            :title="msg"
            :type="error.type"
            :closable="false"
            show-icon
          />
        </div>

        <el-button class="submit" type="primary" size="large" native-type="submit" :loading="loading">
          提交企业注册
        </el-button>
      </el-form>
    </div>
  </el-drawer>
</template>

<script>
// ElMessage 由 unplugin-auto-import 按需注入（见 vite.config.js）
import { useUserStore } from '../store'
import { authError } from '../utils/errors'
import { useIsMobile } from '../utils/breakpoint'

const USERNAME_RE = /^[a-zA-Z0-9_]{4,32}$/
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/
const PHONE_RE = /^1\d{10}$/

export default {
  name: 'EnterpriseRegisterDrawer',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'go-enterprise-login'],
  setup() {
    const isMobile = useIsMobile()
    return { isMobile }
  },
  data() {
    const confirmRule = (getPwd, emptyMsg) => ({
      validator: (rule, value, callback) => {
        if (!value) return callback(new Error(emptyMsg))
        if (value !== getPwd()) return callback(new Error('两次输入的密码不一致'))
        callback()
      },
      trigger: 'blur'
    })
    return {
      ent: {
        code: '', name: '', contact_name: '', contact_phone: '',
        admin_username: '', admin_password: '', admin_confirm: '', remark: ''
      },
      rules: {
        code: [
          { required: true, message: '请输入企业编码', trigger: 'blur' },
          // 编码规则文档未细化，先按 2-32 位字母/数字/下划线/短横校验（待后端确认）
          { pattern: /^[A-Za-z0-9_-]{2,32}$/, message: '企业编码为 2-32 位字母、数字、下划线或短横', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入企业名称', trigger: 'blur' },
          { min: 2, max: 64, message: '企业名称为 2-64 个字符', trigger: 'blur' }
        ],
        admin_username: [
          { required: true, message: '请输入管理员登录账号', trigger: 'blur' },
          { pattern: USERNAME_RE, message: '账号需为 4-32 位字母、数字或下划线', trigger: 'blur' }
        ],
        admin_password: [
          { required: true, message: '请输入管理员密码', trigger: 'blur' },
          { pattern: PASSWORD_RE, message: '密码需 8-64 位，且同时包含字母和数字', trigger: 'blur' }
        ],
        admin_confirm: [confirmRule(() => this.ent.admin_password, '请再次输入管理员密码')],
        contact_phone: [{
          validator: (rule, value, callback) => {
            if (!value) return callback()
            if (PHONE_RE.test(value)) return callback()
            callback(new Error('联系电话格式不正确'))
          },
          trigger: 'blur'
        }],
        remark: [{ max: 200, message: '备注不超过 200 个字符', trigger: 'blur' }]
      },
      loading: false,
      submitted: null,
      error: { type: 'error', items: [] }
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(v) {
        this.$emit('update:modelValue', v)
        // 关闭后重置，避免下次打开还停在"已提交"
        if (!v) this.reset()
      }
    },
    drawerSize() {
      return this.isMobile ? '100%' : '460px'
    }
  },
  methods: {
    reset() {
      this.submitted = null
      this.error = { type: 'error', items: [] }
      this.loading = false
      this.$nextTick(() => {
        const form = this.$refs.entRef
        if (form) form.clearValidate()
      })
    },
    async onSubmit() {
      if (this.loading) return
      this.loading = true
      try {
        const valid = await this.$refs.entRef.validate().catch(() => false)
        if (!valid) return
        this.error = { type: 'error', items: [] }

        const res = await useUserStore().registerEnterprise({
          code: this.ent.code.trim(),
          name: this.ent.name.trim(),
          contact_name: this.ent.contact_name.trim() || undefined,
          contact_phone: this.ent.contact_phone.trim() || undefined,
          remark: this.ent.remark.trim() || undefined,
          admin_username: this.ent.admin_username.trim(),
          admin_password: this.ent.admin_password
        })

        if (!res || !res.enterprise_id) {
          throw { code: 'NOT_READY', message: '企业注册接口暂未开放，请联系平台代为开通' }
        }

        // 账号以后端返回为准
        this.submitted = {
          name: this.ent.name.trim(),
          admin_username: res.admin_username || this.ent.admin_username.trim()
        }
      } catch (e) {
        this.error = authError(e)
      } finally {
        this.loading = false
      }
    },
    goEnterpriseLogin() {
      const username = this.submitted ? this.submitted.admin_username : ''
      this.visible = false
      this.$emit('go-enterprise-login', username)
    }
  }
}
</script>

<style scoped>
.wrap {
  padding: 24px 26px 28px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
/* 品牌小标 */
.topic {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  font-size: 11.5px;
  color: var(--brand);
  letter-spacing: 0.04em;
}
.topic .mark {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--accent-gradient);
}
.topic .mark svg {
  width: 13px;
  height: 13px;
}
.head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
}
.head p {
  margin: 5px 0 0;
  font-size: 12.5px;
  color: var(--ink-4);
}
.close {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--ink-4);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.close:hover {
  background: var(--bg-1);
  color: var(--ink-2);
}
.close svg {
  width: 16px;
  height: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 14px;
}
:deep(.el-form-item__label) {
  font-size: 12.5px;
  color: var(--ink-3);
  padding-bottom: 4px;
}
/* 输入框：灰底 + 品牌聚焦环 */
:deep(.el-input__wrapper) {
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--bg-1);
  box-shadow: none;
  transition: background 0.2s, box-shadow 0.2s;
}
:deep(.el-input__wrapper:hover) {
  background: var(--bg-2);
}
:deep(.el-input__wrapper.is-focus) {
  background: var(--bg-0);
  box-shadow: inset 0 0 0 1px var(--brand);
}
:deep(.el-textarea__inner) {
  border-radius: 10px;
  background: var(--bg-1);
  box-shadow: none;
}
:deep(.el-textarea__inner:focus) {
  background: var(--bg-0);
  box-shadow: inset 0 0 0 1px var(--brand);
}

.more {
  border: 0;
  margin-bottom: 4px;
}
.more :deep(.el-collapse-item__header) {
  height: 32px;
  border: 0;
  font-size: 12.5px;
  color: var(--ink-3);
  background: transparent;
}
.more :deep(.el-collapse-item__wrap) {
  border: 0;
  background: transparent;
}
.more :deep(.el-collapse-item__content) {
  padding-top: 8px;
}

.hint {
  margin: 4px 0 14px;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--ink-4);
}

.alerts {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.submit {
  width: 100%;
  height: 44px;
  border-radius: 999px;
  font-size: 14.5px;
}

/* 成功态 */
.done {
  display: flex;
  flex-direction: column;
}
.done-mark {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--success-bg);
  color: var(--success);
  margin-bottom: 12px;
}
.done-mark svg {
  width: 22px;
  height: 22px;
}
.done h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--ink);
}
.muted {
  margin: 8px 0 14px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--ink-3);
}
.notice {
  margin-bottom: 16px;
}
</style>
