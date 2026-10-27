<template>
  <AuthShell :subtitle="isEnterprise ? '企业员工登录 · 由企业管理员开通' : '统一账号 · 统一钱包'">
    <!-- 两个入口：个人 / 企业员工 -->
    <div class="seg" role="tablist" aria-label="登录入口">
      <button
        v-for="e in entries"
        :key="e.value"
        type="button"
        role="tab"
        class="seg-item"
        :class="{ on: entry === e.value }"
        :aria-selected="entry === e.value"
        @click="switchEntry(e.value)"
      >
        {{ e.label }}
      </button>
    </div>

    <el-alert v-if="notice" class="notice" :title="notice" type="warning" :closable="false" show-icon />

    <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="onLogin">
      <el-form-item prop="username">
        <el-input
          v-model="form.username"
          :placeholder="isEnterprise ? '企业管理员分配的账号' : '用户名或手机号'"
          size="large"
          clearable
          autocomplete="username"
        >
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c.9-3.4 3.8-5.4 7.2-5.4s6.3 2 7.2 5.4" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="密码"
          size="large"
          show-password
          autocomplete="current-password"
          @keyup.enter="onLogin"
        >
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="4.5" y="10" width="15" height="10" rx="2.4" /><path d="M8.2 10V7.6a3.8 3.8 0 0 1 7.6 0V10" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-button class="submit" type="primary" native-type="submit" :loading="loading">
        {{ isEnterprise ? '登录企业账号' : '登录' }}
      </el-button>
    </el-form>

    <!-- 错误：一行文案 + 需要时给"切换入口"的动作 -->
    <div v-if="error.items.length" class="alerts">
      <el-alert
        v-for="(msg, i) in error.items"
        :key="i"
        :title="msg"
        :type="error.type"
        :closable="false"
        show-icon
      />
      <el-button v-if="error.switchEntry" class="switch-btn" size="small" @click="flipEntry">
        切换到{{ isEnterprise ? '个人登录' : '企业员工登录' }}
      </el-button>
    </div>

    <!-- 底部链接 -->
    <nav class="links">
      <router-link to="/register">注册账号</router-link>
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

export default {
  name: 'LoginView',
  components: { AuthShell, EnterpriseRegisterDrawer },
  data() {
    return {
      entry: 'personal',
      entries: [
        { value: 'personal', label: '个人登录' },
        { value: 'enterprise', label: '企业员工' }
      ],
      form: { username: '', password: '' },
      rules: {
        username: [{ required: true, message: '请输入用户名或手机号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      },
      loading: false,
      notice: '',
      error: { type: 'error', items: [] },
      openEnterprise: false
    }
  },
  computed: {
    isEnterprise() {
      return this.entry === 'enterprise'
    }
  },
  created() {
    if (this.$route.query.expired) this.notice = '登录已过期，请重新登录'
    if (this.$route.query.changed) this.notice = '密码已修改，请用新密码登录'
    if (this.$route.query.entry === 'enterprise') this.entry = 'enterprise'
  },
  methods: {
    switchEntry(value) {
      if (this.entry === value) return
      this.entry = value
      this.error = { type: 'error', items: [] }
      this.notice = ''
    },
    flipEntry() {
      this.switchEntry(this.isEnterprise ? 'personal' : 'enterprise')
    },
    /** 企业注册成功 → 切到企业员工入口并回填账号 */
    onEnterpriseReady(username) {
      this.switchEntry('enterprise')
      if (username) this.form.username = username
    },
    async onLogin() {
      // 防重复提交：loading 守卫必须在 validate() 之前
      if (this.loading) return
      this.loading = true
      try {
        const valid = await this.$refs.formRef.validate().catch(() => false)
        if (!valid) return
        this.error = { type: 'error', items: [] }
        this.notice = ''

        const store = useUserStore()
        const res = this.isEnterprise
          ? await store.loginEnterprise(this.form.username, this.form.password)
          : await store.login(this.form.username, this.form.password)

        // 首次登录须先改密（后端只放行改密接口）
        if (res && (res.user?.must_change_password || res.must_change_password)) {
          ElMessage.warning('首次登录，请先修改初始密码')
          this.$router.replace({ name: 'force-password' })
          return
        }

        ElMessage.success('登录成功')
        const redirect = this.$route.query.redirect
        this.$router.push(redirect && String(redirect).startsWith('/') ? redirect : '/')
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
/* 入口切换 */
.seg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  padding: 3px;
  margin: 18px 0 14px;
  background: var(--bg-1);
  border-radius: 999px;
}
.seg-item {
  height: 32px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--ink-3);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.seg-item:hover {
  color: var(--ink);
}
.seg-item.on {
  background: var(--bg-0);
  color: var(--brand);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(16, 22, 48, 0.08);
}

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

.notice {
  margin-bottom: 10px;
}
.alerts {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.switch-btn {
  align-self: flex-start;
}

/* 底部链接行 */
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
  color: var(--ink-3);
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
.links a:hover,
.link-btn:hover {
  color: var(--brand);
}
.dot {
  color: var(--line-2);
}

@media (max-width: 768px) {
  .seg-item {
    height: 38px;
  }
}
</style>
