<template>
  <Layout>
    <div class="space-y-4 sm:space-y-6">
      <div class="flex items-center justify-between">
        <h2
          class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
        >
          登录记录
        </h2>
        <button
          @click="loadRecords(1)"
          :disabled="loading"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          刷新
        </button>
      </div>

      <div v-if="loading && !records.length" class="flex justify-center py-12">
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

      <div
        v-else-if="error"
        class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm sm:text-base"
      >
        {{ error }}
      </div>

      <template v-else>
        <div
          v-if="records.length === 0"
          class="text-center py-12 text-gray-500 dark:text-gray-400"
        >
          <p>暂无登录记录</p>
        </div>

        <div v-else>
          <!-- 统计信息 -->
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              共 {{ total }} 条记录
            </p>
          </div>

          <!-- 桌面端表格 -->
          <div
            class="hidden sm:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <table class="w-full text-sm">
              <thead>
                <tr
                  class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700"
                >
                  <th
                    class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    时间
                  </th>
                  <th
                    class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    用户名
                  </th>
                  <th
                    class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    IP 地址
                  </th>
                  <th
                    class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    状态
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr
                  v-for="(record, idx) in records"
                  :key="idx"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td
                    class="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                  >
                    {{ formatDate(record.timestamp) }}
                  </td>
                  <td class="px-4 py-2.5 text-gray-900 dark:text-white">
                    <code
                      class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs"
                      >{{ record.username }}</code
                    >
                  </td>
                  <td class="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                    <code
                      class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs"
                      >{{ record.ip }}</code
                    >
                  </td>
                  <td class="px-4 py-2.5">
                    <span
                      :class="
                        record.success
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      "
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ record.success ? '成功' : '失败' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 移动端卡片 -->
          <div class="sm:hidden space-y-2">
            <div
              v-for="(record, idx) in records"
              :key="idx"
              class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(record.timestamp) }}
                </span>
                <span
                  :class="
                    record.success
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  "
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ record.success ? '成功' : '失败' }}
                </span>
              </div>
              <div class="flex items-center space-x-3 text-xs">
                <span class="text-gray-600 dark:text-gray-400"
                  >用户:
                  <code
                    class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded"
                    >{{ record.username }}</code
                  ></span
                >
                <span class="text-gray-600 dark:text-gray-400"
                  >IP:
                  <code
                    class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded"
                    >{{ record.ip }}</code
                  ></span
                >
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div
            v-if="totalPages > 1"
            class="flex items-center justify-center space-x-2 mt-4"
          >
            <button
              @click="loadRecords(page - 1)"
              :disabled="page <= 1 || loading"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              上一页
            </button>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ page }} / {{ totalPages }}
            </span>
            <button
              @click="loadRecords(page + 1)"
              :disabled="page >= totalPages || loading"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              下一页
            </button>
          </div>
        </div>
      </template>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { authAPI } from '../api'

const loading = ref(false)
const error = ref('')
const records = ref([])
const page = ref(1)
const total = ref(0)
const totalPages = ref(0)

onMounted(() => {
  loadRecords(1)
})

async function loadRecords(p = 1) {
  loading.value = true
  error.value = ''
  try {
    const res = await authAPI.loginRecords(p, 50)
    records.value = res.data.items
    page.value = res.data.page
    total.value = res.data.total
    totalPages.value = res.data.totalPages
  } catch (err) {
    error.value = err.response?.data?.error || '加载登录记录失败'
  } finally {
    loading.value = false
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
