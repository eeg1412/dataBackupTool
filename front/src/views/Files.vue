<template>
  <Layout>
    <div class="space-y-4 sm:space-y-6">
      <div class="flex items-center justify-between">
        <h2
          class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
        >
          文件管理
        </h2>
      </div>

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

      <div
        v-else-if="error"
        class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm sm:text-base"
      >
        {{ error }}
      </div>

      <template v-else>
        <div
          v-if="directories.length === 0"
          class="text-center py-12 text-gray-500 dark:text-gray-400"
        >
          <svg
            class="mx-auto h-12 w-12 mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <p>没有配置任何目录</p>
        </div>

        <!-- Breadcrumb -->
        <nav
          v-if="currentPath"
          class="flex items-center flex-wrap gap-1 text-sm text-gray-500 dark:text-gray-400"
        >
          <button
            @click="goToRoot"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            全部目录
          </button>
          <span
            v-for="(seg, i) in breadcrumbs"
            :key="i"
            class="flex items-center space-x-1"
          >
            <svg
              class="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <button
              v-if="i < breadcrumbs.length - 1"
              @click="navigateToBreadcrumb(i)"
              class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-30 sm:max-w-none"
            >
              {{ seg }}
            </button>
            <span
              v-else
              class="text-gray-900 dark:text-white font-medium truncate max-w-30 sm:max-w-none"
              >{{ seg }}</span
            >
          </span>
        </nav>

        <!-- Root directory list -->
        <div
          v-if="!currentPath"
          class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="dir in directories"
            :key="dir.path"
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3 min-w-0">
                <div
                  class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg shrink-0"
                >
                  <svg
                    class="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div class="min-w-0">
                  <button
                    @click="browseTo(dir.path)"
                    class="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left truncate block max-w-full"
                  >
                    {{ dir.name }}
                  </button>
                  <p
                    class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5"
                  >
                    {{ dir.path }}
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-3 sm:mt-4 flex space-x-2">
              <button
                @click="browseTo(dir.path)"
                class="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                浏览
              </button>
              <button
                @click="downloadDir(dir.path, dir.name)"
                :disabled="downloading === dir.path"
                class="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {{ downloading === dir.path ? '准备中...' : '下载 ZIP' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Browse directory contents -->
        <div
          v-else
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div
            class="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2"
          >
            <div class="flex items-center space-x-2 min-w-0">
              <button
                @click="goBack"
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
              >
                <svg
                  class="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span
                class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate"
                >当前目录</span
              >
            </div>
            <button
              @click="downloadDir(currentPath, currentDirName)"
              :disabled="!!downloading"
              class="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              {{ downloading === currentPath ? '准备中...' : '下载当前目录' }}
            </button>
          </div>

          <div v-if="browseLoading" class="flex justify-center py-8">
            <svg
              class="animate-spin h-6 w-6 text-blue-600"
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
            v-else-if="items.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm"
          >
            目录为空
          </div>

          <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <div
              v-for="item in sortedItems"
              :key="item.path"
              class="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <svg
                  v-if="item.isDirectory"
                  class="w-5 h-5 text-yellow-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <button
                  v-if="item.isDirectory"
                  @click="browseTo(item.path)"
                  class="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                >
                  {{ item.name }}
                </button>
                <span
                  v-else
                  class="text-sm text-gray-700 dark:text-gray-300 truncate"
                  >{{ item.name }}</span
                >
              </div>
              <button
                v-if="item.isDirectory"
                @click="downloadDir(item.path, item.name)"
                :disabled="!!downloading"
                class="ml-2 px-2 sm:px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 shrink-0"
              >
                下载
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { filesAPI, getSecureFileDownloadUrl } from '../api'

const loading = ref(true)
const browseLoading = ref(false)
const error = ref('')
const directories = ref([])
const currentPath = ref('')
const items = ref([])
const downloading = ref('')
const pathHistory = ref([])

const currentDirName = computed(() => {
  if (!currentPath.value) return ''
  const parts = currentPath.value.replace(/[\\/]+$/, '').split(/[\\/]/)
  return parts[parts.length - 1] || currentPath.value
})

const breadcrumbs = computed(() => {
  if (!currentPath.value) return []
  const rootDir = directories.value.find(d =>
    currentPath.value.startsWith(d.path)
  )
  if (!rootDir) return [currentDirName.value]
  const relative = currentPath.value
    .slice(rootDir.path.length)
    .replace(/^[\\/]/, '')
  const parts = [rootDir.name]
  if (relative) {
    parts.push(...relative.split(/[\\/]/).filter(Boolean))
  }
  return parts
})

const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })
})

onMounted(async () => {
  await loadDirectories()
})

async function loadDirectories() {
  loading.value = true
  error.value = ''
  try {
    const res = await filesAPI.list()
    directories.value = res.data.directories
  } catch (err) {
    error.value = err.response?.data?.error || '加载目录列表失败'
  } finally {
    loading.value = false
  }
}

async function browseTo(dirPath) {
  browseLoading.value = true
  if (currentPath.value) {
    pathHistory.value.push(currentPath.value)
  }
  currentPath.value = dirPath
  try {
    const res = await filesAPI.browse(dirPath)
    items.value = res.data.items
  } catch (err) {
    items.value = []
    error.value = err.response?.data?.error || '无法读取目录'
  } finally {
    browseLoading.value = false
  }
}

function goBack() {
  if (pathHistory.value.length > 0) {
    const prev = pathHistory.value.pop()
    currentPath.value = ''
    browseTo(prev)
    pathHistory.value.pop()
  } else {
    goToRoot()
  }
}

function goToRoot() {
  currentPath.value = ''
  items.value = []
  pathHistory.value = []
}

function navigateToBreadcrumb(index) {
  const rootDir = directories.value.find(d =>
    currentPath.value.startsWith(d.path)
  )
  if (!rootDir) return
  if (index === 0) {
    currentPath.value = ''
    browseTo(rootDir.path)
    pathHistory.value = []
    return
  }
  const relative = currentPath.value
    .slice(rootDir.path.length)
    .replace(/^[\\/]/, '')
  const parts = relative.split(/[\\/]/).filter(Boolean)
  const targetRelative = parts.slice(0, index).join('/')
  const targetPath = rootDir.path + '/' + targetRelative
  pathHistory.value = []
  currentPath.value = ''
  browseTo(targetPath)
}

async function downloadDir(dirPath, name) {
  downloading.value = dirPath
  try {
    const url = await getSecureFileDownloadUrl(dirPath)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name || 'download'}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err) {
    console.error('获取下载凭证失败:', err)
  } finally {
    setTimeout(() => {
      downloading.value = ''
    }, 2000)
  }
}
</script>
