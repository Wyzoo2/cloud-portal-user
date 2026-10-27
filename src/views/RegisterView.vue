<template>
  <AuthShell subtitle="注册即自动登录，开启云端之旅">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onRegister">
      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="用户名（4-32 位字母、数字、下划线）" size="large" clearable>
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c.9-3.4 3.8-5.4 7.2-5.4s6.3 2 7.2 5.4" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input v-model="form.password" type="password" placeholder="密码（8-64 位，含字母和数字）" size="large" show-password>
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="4.5" y="10" width="15" height="10" rx="2.4" /><path d="M8.2 10V7.6a3.8 3.8 0 0 1 7.6 0V10" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="confirm">
        <el-input v-model="form.confirm" type="password" placeholder="确认密码" size="large" show-password>
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="4.5" y="10" width="15" height="10" rx="2.4" /><path d="M8.2 10V7.6a3.8 3.8 0 0 1 7.6 0V10" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="phone">
        <el-input v-model="form.phone" placeholder="手机号（选填）" size="large" clearable>
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="6.5" y="2.8" width="11" height="18.4" rx="2.2" /><path d="M10.8 18.4h2.4" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-button class="submit" type="primary" native-type="submit" :loading="loading">
        注册并登录
      </el-button>
    </el-form>

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

    <nav class="links">
      <span>已有账号？<router-link to="/login">去登录</router-link></span>
      <span class="dot">·</span>
      <button type="button" class="link-btn" @click="openEnterprise = true">企业注册</button>
    </nav>

    <EnterpriseRegisterDrawer v-model="openEnterprise" @go-enterprise-login="onEnterpriseReady" />
  </AuthShell>
</template>

<script>
// ElMessage 由 unplugin-auto-import 按需注入（见 vite.config.js）
import { useUserStore } from '../store'
import { authError } from '../utils/errors'
import AuthShell from '../components/AuthShell.vue'
import EnterpriseRegisterDrawer from '../components/EnterpriseRegisterDrawer.vue'

const USERNAME_RE = /^[a-zA-Z0-9_]{4,32}$/
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/
const PHONE_RE = /^1\d{10}$/

export default {
  name: 'RegisterView',
  components: { AuthShell, EnterpriseRegisterDrawer },
  data() {
    return {
      form: { username: '', password: '', confirm: '', phone: '' },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { pattern: USERNAME_RE, message: '用户名需为 4-32 位字母、数字或下划线', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { pattern: PASSWORD_RE, message: '密码需 8-64 位，且同时包含字母和数字', trigger: 'blur' }
        ],
        confirm: [{
          validator: (rule, value, callback) => {
            if (!value) return callback(new Error('请再次输入密码'))
            if (value !== this.form.password) return callback(new Error('两次输入的密码不一致'))
            callback()
          },
          trigger: 'blur'
        }],
        phone: [{
          validator: (rule, value, callback) => {
            if (!value) return callback()
            if (PHONE_RE.test(value)) return callback()
            callback(new Error('手机号格式不正确'))
          },
          trigger: 'blur'
        }]
      },
      loading: false,
      error: { type: 'error', items: [] },
      openEnterprise: false
    }
  },
  created() {
    // 旧链接 ?entry=enterprise 直接开抽屉
    if (this.$route.query.entry === 'enterprise') this.openEnterprise = true
  },
  methods: {
    /** 企业注册成功 → 去企业员工入口登录 */
    onEnterpriseReady() {
      this.$router.push({ path: '/login', query: { entry: 'enterprise' } })
    },
    async onRegister() {
      if (this.loading) return
      this.loading = true
      try {
        const valid = await this.$refs.formRef.validate().catch(() => false)
        if (!valid) return
        this.error = { type: 'error', items: [] }
        await useUserStore().register({
          username: this.form.username,
          password: this.form.password,
          phone: this.form.phone || undefined
        })
        ElMessage.success('注册成功，已自动登录')
        this.$router.push('/')
      } catch (e) {
        this.error = authError(e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
/* 输入框：灰底胶囊 + 图标 */
:deep(.el-form-item) {
  margin-bottom: 12px;
}
/* 校验提示：改成流式，避免绝对定位压到下一个输入框 */
:deep(.el-form-item__error) {
  position: static;
  margin-top: 5px;
  padding: 0 0 0 16px;
  font-size: 11.5px;
  line-height: 1.45;
}
:deep(.el-input__wrapper) {
  height: 46px;
  padding: 0 16px;
  border-radius: 999px;
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
:deep(.el-input__inner) {
  font-size: 14px;
}
.ico {
  width: 17px;
  height: 17px;
  color: var(--ink-4);
  margin-right: 2px;
}

.submit {
  width: 100%;
  height: 46px;
  margin-top: 4px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
}

.alerts {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 12.5px;
  color: var(--ink-3);
}
.links a,
.link-btn {
  color: var(--brand);
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
.link-btn {
  color: var(--ink-3);
}
.link-btn:hover {
  color: var(--brand);
}
.dot {
  color: var(--line-2);
}
</style>
