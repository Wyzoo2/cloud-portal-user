<template>
  <div class="auth">
    <div class="auth-panel">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <div class="brand-logo">
          <span class="mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          云平台统一门户
        </div>
        <h2>一个账号，<br />畅享云端资源</h2>
        <p>统一账号、统一钱包，云存储 / 云手机 / 云电脑 一站租齐。</p>
        <div class="brand-tags">
          <span>秒级开通</span>
          <span>一个钱包</span>
          <span>安全隔离</span>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="form-side">
        <h1>创建账号</h1>
        <p class="sub">注册即自动登录，开启云端之旅</p>
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="onRegister">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名（4-32 位字母、数字、下划线）" size="large" clearable />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码（8-64 位，需含字母和数字）" size="large" show-password />
          </el-form-item>
          <el-form-item prop="phone">
            <el-input v-model="form.phone" placeholder="手机号（选填）" size="large" clearable />
          </el-form-item>
          <el-button class="submit" type="primary" size="large" native-type="submit" :loading="loading">
            注册
          </el-button>
          <el-alert v-if="error" class="alert" :title="error" type="error" :closable="false" show-icon />
        </el-form>
        <div class="foot">
          已有账号？<router-link to="/login">去登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../store'
import { errorMessage } from '../utils/errors'

export default {
  name: 'RegisterView',
  data() {
    return {
      form: { username: '', password: '', phone: '' },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9_]{4,32}$/, message: '用户名需为 4-32 位字母、数字或下划线', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { pattern: /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/, message: '密码需 8-64 位，且同时包含字母和数字', trigger: 'blur' }
        ],
        phone: [
          {
            validator: (rule, value, callback) => {
              if (!value) return callback()
              if (/^1\d{10}$/.test(value)) return callback()
              callback(new Error('手机号格式不正确'))
            },
            trigger: 'blur'
          }
        ]
      },
      loading: false,
      error: ''
    }
  },
  methods: {
    async onRegister() {
      const valid = await this.$refs.formRef.validate().catch(() => false)
      if (!valid) return
      this.loading = true
      this.error = ''
      try {
        await useUserStore().register({
          username: this.form.username,
          password: this.form.password,
          phone: this.form.phone || undefined
        })
        this.$router.push('/')
      } catch (e) {
        // 1001 的 data.errors 是字符串数组，逐条拼接展示
        if (e && e.code === 1001 && e.data && Array.isArray(e.data.errors)) {
          this.error = e.data.errors.join('；')
        } else {
          this.error = errorMessage(e && e.code, e && e.message)
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(800px 420px at 85% -10%, rgba(51, 214, 255, 0.16), transparent),
    radial-gradient(700px 420px at 0% 0%, rgba(65, 95, 255, 0.3), transparent),
    var(--bg-dark);
}
.auth-panel {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  width: 100%;
  max-width: 880px;
  background: var(--bg-0);
  border-radius: var(--r-xl);
  overflow: hidden;
  box-shadow: var(--sh-3);
}
.brand-side {
  padding: 52px 44px;
  color: #fff;
  background:
    radial-gradient(420px 320px at 100% 0%, rgba(51, 214, 255, 0.16), transparent),
    linear-gradient(160deg, var(--bg-dark), var(--bg-dark-2));
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 28px;
}
.brand-logo .mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--brand);
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: var(--sh-brand);
}
.brand-side h2 {
  font-size: 30px;
  line-height: 1.3;
  margin: 0 0 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.brand-side p {
  color: rgba(255, 255, 255, 0.58);
  font-size: 14px;
  line-height: 1.7;
  margin: 0 0 26px;
  max-width: 300px;
}
.brand-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.brand-tags span {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 6px 14px;
  border-radius: var(--r-pill);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}
.form-side {
  padding: 52px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.form-side h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.form-side .sub {
  color: var(--ink-3);
  font-size: 14px;
  margin: 6px 0 28px;
}
.submit {
  width: 100%;
}
.alert {
  margin-top: 12px;
}
.foot {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-3);
}
@media (max-width: 1000px) {
  .auth {
    padding: 16px;
  }
  .auth-panel {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
  .brand-side {
    display: none;
  }
  .form-side {
    padding: 32px 24px;
  }
}
</style>
