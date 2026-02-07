<template>
  <Layout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          密码管理
        </h2>
        <button
          v-if="passwords.length > 0"
          @click="confirmClearAll"
          class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
        >
          清除全部
        </button>
      </div>

      <p class="text-sm text-gray-500 dark:text-gray-400">
        管理已保存在浏览器中的 Borg 仓库密码。密码仅存储在本地浏览器的 IndexedDB
        中，不会上传到服务器。
      </p>

      <div v-if="loading" class="flex justify-center py-12">
        <svg
          class="animate-spin h-8 w-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>

      <div v-else-if="passwords.length === 0" class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">没有保存的密码</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
          在 Borg 备份页面展开仓库时可以选择保存密码
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="pwd in passwords"
          :key="pwd.repoPath"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center space-x-2">
                <svg
                  class="w-4 h-4 text-green-600 dark:text-green-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
                <p
                  class="text-sm font-medium text-gray-900 dark:text-white truncate"
                >
                  {{ pwd.repoPath }}
                </p>
              </div>
              <div class="mt-1 flex items-center space-x-3">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  密码: {{ pwd.visible ? pwd.passphrase : '••••••••' }}
                </span>
                <button
                  @click="toggleVisible(pwd)"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {{ pwd.visible ? '隐藏' : '显示' }}
                </button>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                保存于: {{ formatDate(pwd.savedAt) }}
              </p>
            </div>
            <button
              @click="handleDelete(pwd.repoPath)"
              class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors shrink-0"
              title="删除"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 确认删除对话框 -->
      <div
        v-if="showConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        @click.self="showConfirm = false"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ confirmTitle }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">
            {{ confirmMessage }}
          </p>
          <div class="flex justify-end space-x-3">
            <button
              @click="showConfirm = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="executeConfirm"
              class="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import {
  getAllPasswords,
  deletePassword,
  clearAllPasswords
} from '../utils/borgPasswordDB'

const loading = ref(true)
const passwords = ref([])
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
let confirmAction = null

onMounted(async () => {
  await loadPasswords()
})

async function loadPasswords() {
  loading.value = true
  try {
    const all = await getAllPasswords()
    passwords.value = all.map(p => ({ ...p, visible: false }))
  } catch (err) {
    console.error('加载密码失败:', err)
  } finally {
    loading.value = false
  }
}

function toggleVisible(pwd) {
  pwd.visible = !pwd.visible
}

function handleDelete(repoPath) {
  confirmTitle.value = '删除密码'
  confirmMessage.value = `确定要删除仓库「${repoPath}」的保存密码吗？`
  confirmAction = async () => {
    await deletePassword(repoPath)
    await loadPasswords()
  }
  showConfirm.value = true
}

function confirmClearAll() {
  confirmTitle.value = '清除全部密码'
  confirmMessage.value =
    '确定要清除所有已保存的 Borg 仓库密码吗？此操作不可撤销。'
  confirmAction = async () => {
    await clearAllPasswords()
    await loadPasswords()
  }
  showConfirm.value = true
}

async function executeConfirm() {
  showConfirm.value = false
  if (confirmAction) {
    try {
      await confirmAction()
    } catch (err) {
      console.error('操作失败:', err)
    }
    confirmAction = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}
</script>
