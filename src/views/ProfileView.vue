<template>
  <div class="profile">
    <!-- 用户信息 -->
    <div class="user-card" v-reveal>
      <div class="avatar">{{ avatarText }}</div>
      <div class="user-info">
        <b>{{ username }}</b>
        <small>用户 ID：{{ userId }}</small>
      </div>
    </div>

    <!-- 修改密码 -->
    <div class="pwd-card" v-reveal="{ delay: 100 }">
      <h2>修改密码</h2>
      <p class="tip">新密码 8-64 位，需同时包含字母和数字。修改成功后所有设备将重新登录。</p>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="onSubmit">
        <el-form-item prop="old_password">
          <el-input v-model="form.old_password" type="password" placeholder="当前密码" size="large" show-password />
        </el-form-item>
        <el-form-item prop="new_password">
          <el-input v-model="form.new_password" type="password" placeholder="新密码（8-64 位，含字母和数字）" size="large" show-password />
        </el-form-item>
        <el-form-item prop="confirm_password">
          <el-input v-model="form.confirm_password" type="password" placeholder="确认新密码" size="large" show-password />
        </el-form-item>
        <el-button class="submit" type="primary" size="large" native-type="submit" :loading="loading">
          确认修改
        </el-button>
        <el-alert v-if="error" class="alert" :title="error" type="error" :closable="false" show-icon />
      </el-form>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store'
import { api } from '../api'
import { errorMessage } from '../utils/errors'

export default {
  name: 'ProfileView',
  data() {
    return {
      form: { old_password: '', new_password: '', confirm_password: '' },
      rules: {
        old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
        new_password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { pattern: /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/, message: '新密码需 8-64 位，且同时包含字母和数字', trigger: 'blur' }
        ],
        confirm_password: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value !== this.form.new_password) callback(new Error('两次输入的密码不一致'))
              else callback()
            },
            trigger: 'blur'
          }
        ]
      },
      loading: false,
      error: ''
    }
  },
  computed: {
    ...mapState(useUserStore, ['user']),
    username() {
      return (this.user && this.user.username) || '未登录'
    },
    userId() {
      return (this.user && this.user.id) || '-'
    },
    avatarText() {
      return this.username.charAt(0).toUpperCase()
    }
  },
  methods: {
    ...mapActions(useUserStore, ['logout']),
    async onSubmit() {
      const valid = await this.$refs.formRef.validate().catch(() => false)
      if (!valid) return
      this.loading = true
      this.error = ''
      try {
        await api.changePassword(this.form.old_password, this.form.new_password)
        // 改密成功会吊销全部 refresh 会话，引导重新登录
        ElMessage.success('密码修改成功，请重新登录')
        this.logout()
        this.$router.push('/login')
      } catch (e) {
        // 改密场景 2003 = 当前密码错误（区别于登录的"账号或密码错误"）
        if (e && e.code === 2003) {
          this.error = '当前密码错误'
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
.profile {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
  max-width: 560px;
}
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-1);
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.user-info b {
  font-size: 18px;
  font-weight: 600;
}
.user-info small {
  color: var(--ink-3);
  font-size: 13px;
  margin-top: 4px;
}
.pwd-card {
  padding: 28px 24px;
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-1);
}
.pwd-card h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
}
.tip {
  color: var(--ink-3);
  font-size: 13px;
  margin: 0 0 24px;
  line-height: 1.6;
}
.submit {
  width: 100%;
}
.alert {
  margin-top: 12px;
}
</style>
