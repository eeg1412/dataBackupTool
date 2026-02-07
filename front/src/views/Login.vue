<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <h2 class="text-2xl font-bold mb-6 text-center">数据备份管理系统</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div class="mb-4">
          <label class="flex items-center">
            <input v-model="form.remember" type="checkbox" class="mr-2" />
            <span class="text-gray-700">长期保持登录</span>
          </label>
        </div>
        <button
          type="submit"
          class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <div v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const form = ref({
  username: '',
  password: '',
  remember: false
})
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/api/login', form.value)
    localStorage.setItem('token', response.data.token)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || '登录失败，请检查用户名密码'
  } finally {
    loading.value = false
  }
}
</script>
