<template>
  <div class="page">
    <el-card class="card">
      <h1>登录</h1>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="onLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名 / 手机号" size="large" clearable />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>
        <el-button class="submit" type="primary" size="large" native-type="submit" :loading="loading">
          登录
        </el-button>
        <el-alert v-if="error" class="alert" :title="error" type="error" :closable="false" show-icon />
      </el-form>
      <div class="foot">
        <router-link to="/register">没有账号？去注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
import { useUserStore } from '../store'

export default {
  name: 'LoginView',
  data() {
    return {
      form: { username: '', password: '' },
      rules: {
        username: [{ required: true, message: '请输入用户名或手机号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      },
      loading: false,
      error: ''
    }
  },
  methods: {
    async onLogin() {
      const valid = await this.$refs.formRef.validate().catch(() => false)
      if (!valid) return
      this.loading = true
      this.error = ''
      try {
        await useUserStore().login(this.form.username, this.form.password)
        this.$router.push('/')
      } catch (e) {
        this.error = (e && e.message) || '登录失败'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.card {
  width: 360px;
}
h1 {
  margin: 0 0 20px;
  font-size: 22px;
  text-align: center;
}
.submit {
  width: 100%;
}
.alert {
  margin-top: 12px;
}
.foot {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
}
</style>
