<template>
  <AuthShell subtitle="首次登录需修改初始密码">
    <h2 class="tip">设置你的新密码</h2>
    <p class="note">
      企业管理员为你设置的初始密码只能用于首次登录，修改后才能使用平台功能。
    </p>

    <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="onSubmit">
      <el-form-item prop="old_password">
        <el-input v-model="form.old_password" type="password" placeholder="当前密码（初始密码）" size="large" show-password>
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="4.5" y="10" width="15" height="10" rx="2.4" /><path d="M8.2 10V7.6a3.8 3.8 0 0 1 7.6 0V10" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="new_password">
        <el-input v-model="form.new_password" type="password" placeholder="新密码（8-64 位，含字母和数字）" size="large" show-password>
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="4.5" y="10" width="15" height="10" rx="2.4" /><path d="M8.2 10V7.6a3.8 3.8 0 0 1 7.6 0V10" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="confirm">
        <el-input v-model="form.confirm" type="password" placeholder="确认新密码" size="large" show-password>
          <template #prefix>
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="4.5" y="10" width="15" height="10" rx="2.4" /><path d="M8.2 10V7.6a3.8 3.8 0 0 1 7.6 0V10" />
            </svg>
          </template>
        </el-input>
      </el-form-item>

      <el-button class="submit" type="primary" native-type="submit" :loading="saving">
        修改密码并重新登录
      </el-button>
    </el-form>

    <el-alert v-if="error" class="alert" :title="error" type="error" :closable="false" show-icon />

    <div class="links">
      <button type="button" class="link-btn" @click="onLogout">退出登录</button>
    </div>
  </AuthShell>
</template>

<script>
// ElMessage 由 unplugin-auto-import 按需注入（见 vite.config.js）
import { api } from '../api'
import { useUserStore } from '../store'
import { errorText } from '../utils/errors'
import AuthShell from '../components/AuthShell.vue'

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/

export default {
  name: 'ForcePasswordView',
  components: { AuthShell },
  data() {
    return {
      form: { old_password: '', new_password: '', confirm: '' },
      rules: {
        old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
        new_password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { pattern: PASSWORD_RE, message: '新密码需 8-64 位，且同时包含字母和数字', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value && value === this.form.old_password) return callback(new Error('新密码不能与当前密码相同'))
              callback()
            },
            trigger: 'blur'
          }
        ],
        confirm: [{
          validator: (rule, value, callback) => {
            if (!value) return callback(new Error('请再次输入新密码'))
            if (value !== this.form.new_password) return callback(new Error('两次输入的密码不一致'))
            callback()
          },
          trigger: 'blur'
        }]
      },
      saving: false,
      error: ''
    }
  },
  methods: {
    async onSubmit() {
      if (this.saving) return
      this.saving = true
      try {
        const valid = await this.$refs.formRef.validate().catch(() => false)
        if (!valid) return
        this.error = ''
        await api.changePassword(this.form.old_password, this.form.new_password)
        ElMessage.success('密码已修改，请用新密码重新登录')
        this.finish()
      } catch (e) {
        // 改密场景 2003 = 当前密码错误
        this.error = Number(e && e.code) === 2003 ? '当前密码错误' : errorText(e)
      } finally {
        this.saving = false
      }
    },
    /** 改密成功后后端会吊销全部会话，这里清本地并回登录页 */
    finish() {
      useUserStore().logout()
      this.$router.replace({ path: '/login', query: { changed: '1' } })
    },
    onLogout() {
      useUserStore().logout()
      this.$router.replace('/login')
    }
  }
}
</script>

<style scoped>
.tip {
  margin: 18px 0 0;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  color: var(--ink);
}
.note {
  margin: 6px 0 16px;
  font-size: 12px;
  line-height: 1.7;
  text-align: center;
  color: var(--ink-4);
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}
/* 校验提示走流式，避免压住下一个输入框 */
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

.alert {
  margin-top: 12px;
}

.links {
  margin-top: 14px;
  text-align: center;
}
.link-btn {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  font-size: 12.5px;
  color: var(--ink-3);
  cursor: pointer;
}
.link-btn:hover {
  color: var(--brand);
}
</style>
