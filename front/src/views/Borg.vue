<template>
  <Layout>
    <div class="space-y-4 sm:space-y-6">
      <div class="flex items-center justify-between">
        <h2
          class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
        >
          Borg 备份
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
        v-else-if="!available"
        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6 text-center"
      >
        <svg
          class="mx-auto h-10 w-10 text-yellow-500 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p
          class="text-yellow-800 dark:text-yellow-300 font-medium text-sm sm:text-base"
        >
          {{ unavailableMessage }}
        </p>
      </div>

      <div
        v-else-if="error"
        class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm sm:text-base"
      >
        {{ error }}
      </div>

      <template v-else>
        <div
          v-if="repos.length === 0"
          class="text-center py-12 text-gray-500 dark:text-gray-400"
        >
          <p>没有配置任何 Borg 仓库</p>
        </div>

        <div v-else class="space-y-3 sm:space-y-4">
          <div
            v-for="repo in repos"
            :key="repo.path"
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              @click="toggleRepo(repo)"
              class="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div class="flex items-center space-x-3 min-w-0">
                <div
                  class="p-1.5 sm:p-2 bg-green-50 dark:bg-green-900/30 rounded-lg shrink-0"
                >
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400"
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
                </div>
                <div class="text-left min-w-0">
                  <p
                    class="text-sm font-medium text-gray-900 dark:text-white truncate"
                  >
                    {{ repo.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ repo.path }}
                  </p>
                </div>
              </div>
              <svg
                class="w-5 h-5 text-gray-400 transition-transform shrink-0 ml-2"
                :class="{ 'rotate-180': repo.expanded }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              v-if="repo.expanded"
              class="border-t border-gray-200 dark:border-gray-700"
            >
              <div v-if="repo.loading" class="flex justify-center py-6">
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
                v-else-if="repo.error"
                class="px-4 sm:px-5 py-4 text-red-600 dark:text-red-400 text-sm"
              >
                {{ repo.error }}
                <button
                  v-if="repo.needsPassword"
                  @click="promptPassword(repo)"
                  class="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  输入密码重试
                </button>
              </div>

              <div
                v-else-if="repo.archives && repo.archives.length === 0"
                class="px-4 sm:px-5 py-4 text-gray-500 dark:text-gray-400 text-sm text-center"
              >
                该仓库没有存档
              </div>

              <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
                <div
                  v-for="archive in repo.archives"
                  :key="archive.name"
                  class="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate"
                    >
                      {{ archive.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(archive.start) }}
                    </p>
                  </div>
                  <button
                    @click="downloadArchive(repo, archive.name)"
                    :disabled="downloading === `${repo.path}::${archive.name}`"
                    class="ml-2 sm:ml-3 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {{
                      downloading === `${repo.path}::${archive.name}`
                        ? '准备中...'
                        : '下载'
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 密码输入对话框 -->
      <div
        v-if="showPasswordDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        @click.self="cancelPassword"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-5 sm:p-6 max-w-sm w-full"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            输入仓库密码
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
            {{ passwordRepo?.path }}
          </p>
          <form @submit.prevent="submitPassword">
            <input
              ref="passwordInput"
              v-model="passwordValue"
              type="password"
              required
              autocomplete="off"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
              placeholder="Borg 仓库密码"
            />
            <label class="flex items-center mt-3 cursor-pointer">
              <input
                v-model="savePassword"
                type="checkbox"
                class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
                >保存密码到浏览器</span
              >
            </label>
            <div class="flex justify-end space-x-3 mt-5">
              <button
                type="button"
                @click="cancelPassword"
                class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="!passwordValue"
                class="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                确认
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import Layout from '../components/Layout.vue'
import { borgAPI, getDownloadUrl } from '../api'
import {
  getPassword,
  savePassword as savePasswordToDB
} from '../utils/borgPasswordDB'

const loading = ref(true)
const error = ref('')
const available = ref(true)
const unavailableMessage = ref('')
const repos = ref([])
const downloading = ref('')

// Password dialog
const showPasswordDialog = ref(false)
const passwordRepo = ref(null)
const passwordValue = ref('')
const savePassword = ref(false)
const passwordInput = ref(null)
let passwordResolve = null

onMounted(async () => {
  await loadRepos()
})

async function loadRepos() {
  loading.value = true
  error.value = ''
  try {
    const res = await borgAPI.repos()
    if (!res.data.available) {
      available.value = false
      unavailableMessage.value = res.data.message
      return
    }
    repos.value = res.data.repos.map(r => ({
      ...r,
      expanded: false,
      loading: false,
      error: '',
      archives: null,
      passphrase: '',
      needsPassword: false
    }))
  } catch (err) {
    error.value = err.response?.data?.error || '加载 Borg 仓库失败'
  } finally {
    loading.value = false
  }
}

function promptPassword(repo) {
  return new Promise(resolve => {
    passwordRepo.value = repo
    passwordValue.value = ''
    savePassword.value = false
    showPasswordDialog.value = true
    passwordResolve = resolve
    nextTick(() => {
      passwordInput.value?.focus()
    })
  })
}

function cancelPassword() {
  showPasswordDialog.value = false
  if (passwordResolve) {
    passwordResolve(null)
    passwordResolve = null
  }
}

async function submitPassword() {
  const value = passwordValue.value
  const shouldSave = savePassword.value
  const repo = passwordRepo.value
  showPasswordDialog.value = false

  if (shouldSave && repo) {
    try {
      await savePasswordToDB(repo.path, value)
    } catch (err) {
      console.error('保存密码失败:', err)
    }
  }

  if (repo) {
    repo.passphrase = value
  }

  if (passwordResolve) {
    passwordResolve(value)
    passwordResolve = null
  }
}

async function toggleRepo(repo) {
  repo.expanded = !repo.expanded
  if (repo.expanded && !repo.archives) {
    await loadArchives(repo)
  }
}

async function loadArchives(repo) {
  repo.loading = true
  repo.error = ''
  repo.needsPassword = false

  // 尝试使用已保存的密码
  let passphrase = repo.passphrase
  if (!passphrase) {
    try {
      const saved = await getPassword(repo.path)
      if (saved) {
        passphrase = saved
        repo.passphrase = saved
      }
    } catch {
      // ignore
    }
  }

  try {
    const res = await borgAPI.archives(repo.path, passphrase)
    repo.archives = res.data.archives
  } catch (err) {
    const errorMsg = err.response?.data?.error || '加载存档列表失败'
    if (err.response?.status === 403 && errorMsg.includes('密码')) {
      repo.needsPassword = true
      repo.error = '该仓库需要密码才能访问'
      // 自动弹出密码输入
      const pwd = await promptPassword(repo)
      if (pwd) {
        await loadArchives(repo)
      }
    } else {
      repo.error = errorMsg
    }
  } finally {
    repo.loading = false
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

function downloadArchive(repo, archiveName) {
  const key = `${repo.path}::${archiveName}`
  downloading.value = key
  const url = getDownloadUrl('borg', {
    repo: repo.path,
    archive: archiveName,
    passphrase: repo.passphrase || ''
  })
  const a = document.createElement('a')
  a.href = url
  a.download = `${archiveName}.tar.gz`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => {
    downloading.value = ''
  }, 2000)
}
</script>
