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
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-2xl font-bold mb-6">目录备份</h2>

        <div class="mb-6">
          <label class="block text-gray-700 mb-2">选择目录类型</label>
          <select
            v-model="backupType"
            class="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="borg">Borg仓库目录</option>
            <option value="normal">普通目录</option>
          </select>
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 mb-2">选择要备份的目录</label>
          <div v-if="directories.length === 0" class="text-gray-500">
            暂无可用目录
          </div>
          <div v-else class="space-y-2">
            <label
              v-for="dir in directories"
              :key="dir"
              class="flex items-center p-3 border rounded hover:bg-gray-50"
            >
              <input
                type="radio"
                v-model="selectedDirectory"
                :value="dir"
                class="mr-3"
              />
              <span>{{ dir }}</span>
            </label>
          </div>
        </div>

        <button
          @click="handleDownload"
          class="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
          :disabled="!selectedDirectory || downloading"
        >
          {{ downloading ? '正在打包下载...' : '打包下载' }}
        </button>

        <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {{ error }}
        </div>

        <div
          v-if="downloading"
          class="mt-4 p-3 bg-blue-100 text-blue-700 rounded"
        >
          正在打包，请稍候...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const backupType = ref('borg')
const directories = ref([])
const selectedDirectory = ref('')
const downloading = ref(false)
const error = ref('')

const loadDirectories = async () => {
  try {
    const response = await api.get('/api/directories', {
      params: { type: backupType.value }
    })
    directories.value = response.data
    selectedDirectory.value = ''
  } catch (err) {
    error.value = '加载目录失败'
    console.error(err)
  }
}

const handleDownload = async () => {
  if (!selectedDirectory.value) return

  downloading.value = true
  error.value = ''

  try {
    const response = await api.get('/api/download', {
      params: {
        type: backupType.value,
        path: selectedDirectory.value
      },
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const fileName = selectedDirectory.value.split(/[/\\]/).pop() || 'backup'
    link.setAttribute('download', `${fileName}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    error.value = err.response?.data?.message || '下载失败'
  } finally {
    downloading.value = false
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

watch(backupType, () => {
  loadDirectories()
})

onMounted(() => {
  loadDirectories()
})
</script>
