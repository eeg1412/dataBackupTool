<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow">
      <div
        class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"
      >
        <h1 class="text-xl font-bold">数据备份管理系统</h1>
        <div class="flex items-center space-x-4">
          <router-link to="/dashboard" class="text-gray-700 hover:text-blue-500"
            >仪表盘</router-link
          >
          <router-link to="/backup" class="text-gray-700 hover:text-blue-500"
            >备份管理</router-link
          >
          <button @click="handleLogout" class="text-red-500 hover:text-red-700">
            退出
          </button>
        </div>
      </div>
    </nav>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">备份总数</h3>
          <p class="text-3xl font-bold text-blue-500">
            {{ stats.totalBackups }}
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">仓库数量</h3>
          <p class="text-3xl font-bold text-green-500">
            {{ stats.repositories }}
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">总大小</h3>
          <p class="text-3xl font-bold text-purple-500">
            {{ stats.totalSize }}
          </p>
        </div>
      </div>

      <div class="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">最近登录记录</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left">时间</th>
                <th class="px-4 py-2 text-left">用户</th>
                <th class="px-4 py-2 text-left">IP地址</th>
                <th class="px-4 py-2 text-left">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in loginLogs"
                :key="log.timestamp"
                class="border-t"
              >
                <td class="px-4 py-2">{{ formatDate(log.timestamp) }}</td>
                <td class="px-4 py-2">{{ log.username }}</td>
                <td class="px-4 py-2">{{ log.ip }}</td>
                <td class="px-4 py-2">
                  <span
                    :class="log.success ? 'text-green-500' : 'text-red-500'"
                  >
                    {{ log.success ? '成功' : '失败' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const stats = ref({
  totalBackups: 0,
  repositories: 0,
  totalSize: '0 GB'
})
const loginLogs = ref([])

const loadStats = async () => {
  try {
    const response = await api.get('/api/stats')
    stats.value = response.data
  } catch (err) {
    console.error('Failed to load stats:', err)
  }
}

const loadLoginLogs = async () => {
  try {
    const response = await api.get('/api/login-logs')
    loginLogs.value = response.data
  } catch (err) {
    console.error('Failed to load login logs:', err)
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

const formatDate = timestamp => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

onMounted(() => {
  loadStats()
  loadLoginLogs()
})
</script>
