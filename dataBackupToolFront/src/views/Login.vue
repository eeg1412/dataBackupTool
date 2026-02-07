<template>
  <div class="login-container">
    <div class="login-form">
      <h1>数据备份工具</h1>
      <h2>管理后台登录</h2>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="请输入管理员用户名"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <button type="submit" :disabled="loading" class="btn-submit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="security-info">
        <p>🔒 安全信息</p>
        <ul>
          <li>登录失败超过 3 次将被禁止访问</li>
          <li>所有登录尝试都会被记录</li>
          <li>请勿在公共网络使用</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/index.js'

const router = useRouter()

const form = ref({
  username: '',
  password: ''
})

const message = ref('')
const messageType = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    message.value = '请输入用户名和密码'
    messageType.value = 'error'
    return
  }

  loading.value = true
  message.value = ''

  try {
    const result = await login(form.value.username, form.value.password)
    message.value = '✅ ' + result.message
    messageType.value = 'success'

    // 登录成功后重定向到首页
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (error) {
    console.error('Login error:', error)

    if (error.status === 403) {
      message.value = '❌ IP 已被禁止，请稍后再试'
    } else if (error.status === 401) {
      message.value = '❌ 用户名或密码错误'
    } else {
      message.value = '❌ 登录失败: ' + (error.data?.error || error.message)
    }
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  margin: 0 0 10px;
  font-size: 24px;
  color: #333;
  text-align: center;
}

h2 {
  margin: 0 0 30px;
  font-size: 16px;
  color: #666;
  text-align: center;
  font-weight: normal;
}

.message {
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

input[type='text'],
input[type='password'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

input[type='text']:focus,
input[type='password']:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.security-info {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.security-info p {
  margin: 0 0 10px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.security-info ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #999;
  list-style-type: disc;
}

.security-info li {
  margin: 5px 0;
}
</style>
