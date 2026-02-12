<template>
  <Layout>
    <div class="space-y-4 sm:space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h2
          class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
        >
          Borg 备份
        </h2>
        <button
          v-if="available && repos.length > 0"
          @click="downloadAllReposWithPassword"
          :disabled="!!downloading || batchDownloading"
          class="px-3 py-1.5 text-xs sm:text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {{
            batchDownloading
              ? `批量下载中 (${batchDownloadProgress}/${batchDownloadTotal})`
              : '一键下载全部'
          }}
        </button>
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
        v-else-if="errorMsgPage"
        class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm sm:text-base"
      >
        {{ errorMsgPage }}
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
            <div class="px-4 sm:px-5 py-3 sm:py-4">
              <button
                @click="toggleRepo(repo)"
                class="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
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
                    <p
                      class="text-xs text-gray-500 dark:text-gray-400 truncate"
                    >
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

              <!-- 下载最新备份按钮 -->
              <button
                @click.stop="downloadLatestArchive(repo)"
                :disabled="downloading === `${repo.path}::latest`"
                class="mt-2 w-full px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {{
                  downloading === `${repo.path}::latest`
                    ? '准备中...'
                    : '下载最新备份'
                }}
              </button>
            </div>

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
                  @click="retryWithPassword(repo)"
                  class="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  重新输入密码
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
                  v-for="(archive, idx) in repo.archives"
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
                    @click="downloadArchive(repo, idx)"
                    :disabled="downloading === `${repo.path}::${idx}`"
                    class="ml-2 sm:ml-3 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {{
                      downloading === `${repo.path}::${idx}`
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
            {{ passwordRepo?.name || passwordRepo?.path }}
          </p>
          <p
            v-if="passwordDialogHint"
            class="text-xs text-red-500 dark:text-red-400 mb-3"
          >
            {{ passwordDialogHint }}
          </p>
          <form @submit.prevent="submitPassword">
            <input
              ref="passwordInput"
              v-model="passwordValue"
              type="password"
              autocomplete="off"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
              placeholder="Borg 仓库密码（无密码可留空）"
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
                type="button"
                @click="submitPasswordEmpty"
                class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                无密码
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
import { borgAPI, getBorgDownloadUrl } from '../api'
import {
  getPassword,
  savePassword as savePasswordToDB,
  getAllPasswords
} from '../utils/borgPasswordDB'
import { useToast } from '../composables/useToast'

const { success, error, info, warning } = useToast()

const loading = ref(true)
const errorMsgPage = ref('')
const available = ref(true)
const unavailableMessage = ref('')
const repos = ref([])
const downloading = ref('')
const batchDownloading = ref(false)
const batchDownloadProgress = ref(0)
const batchDownloadTotal = ref(0)

// Password dialog
const showPasswordDialog = ref(false)
const passwordRepo = ref(null)
const passwordValue = ref('')
const savePassword = ref(false)
const passwordInput = ref(null)
const passwordDialogHint = ref('')
let passwordResolve = null

onMounted(async () => {
  await loadRepos()
})

async function loadRepos() {
  loading.value = true
  errorMsgPage.value = ''
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
      passphraseReady: false, // 标记是否已确认密码（含无密码）
      needsPassword: false
    }))
  } catch (err) {
    errorMsgPage.value = err.response?.data?.error || '加载 Borg 仓库失败'
  } finally {
    loading.value = false
  }
}

function promptPassword(repo, hint = '') {
  return new Promise(resolve => {
    passwordRepo.value = repo
    passwordValue.value = ''
    savePassword.value = false
    passwordDialogHint.value = hint
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

function submitPasswordEmpty() {
  const repo = passwordRepo.value
  showPasswordDialog.value = false

  if (repo) {
    repo.passphrase = ''
    repo.passphraseReady = true
  }

  if (passwordResolve) {
    passwordResolve('')
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
    repo.passphraseReady = true
  }

  if (passwordResolve) {
    passwordResolve(value)
    passwordResolve = null
  }
}

async function toggleRepo(repo) {
  repo.expanded = !repo.expanded
  if (repo.expanded && !repo.archives) {
    // 先检查是否有已保存的密码
    let savedPassword = null
    try {
      savedPassword = await getPassword(repo.path)
    } catch {
      // ignore
    }

    if (savedPassword) {
      // 有保存的密码，直接使用
      repo.passphrase = savedPassword
      repo.passphraseReady = true
      await loadArchives(repo)
    } else {
      // 没有保存的密码，弹出对话框让用户选择
      const pwd = await promptPassword(repo)
      if (pwd === null) {
        // 用户取消，折叠仓库
        repo.expanded = false
        return
      }
      await loadArchives(repo)
    }
  }
}

async function loadArchives(repo) {
  repo.loading = true
  repo.error = ''
  repo.needsPassword = false

  try {
    const res = await borgAPI.archives(repo.path, repo.passphrase || '')
    repo.archives = res.data.archives
  } catch (err) {
    const errorMsg = err.response?.data?.error || '加载存档列表失败'
    if (err.response?.status === 403 && errorMsg.includes('密码')) {
      repo.needsPassword = true
      repo.error = '密码错误或该仓库需要密码'
      // 弹出密码输入，附带提示
      const pwd = await promptPassword(repo, '密码错误，请重新输入正确的密码')
      if (pwd !== null) {
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

async function downloadArchive(repo, archiveIndex) {
  const key = `${repo.path}::${archiveIndex}`
  downloading.value = key
  try {
    // 通过 POST 接口传递 repo + 序号 + 密码，后端返回下载凭证
    const res = await borgAPI.prepareDownload(
      repo.path,
      archiveIndex,
      repo.passphrase || ''
    )
    const url = getBorgDownloadUrl(res.data)
    const archiveName = res.data.archiveName || `archive-${archiveIndex}`
    const a = document.createElement('a')
    a.href = url
    a.download = `${archiveName}.tar.gz`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err) {
    const msg = err.response?.data?.error || '准备下载失败'
    error(msg)
    console.error('下载失败:', err)
  } finally {
    setTimeout(() => {
      downloading.value = ''
    }, 2000)
  }
}

async function downloadLatestArchive(repo) {
  const key = `${repo.path}::latest`
  downloading.value = key

  try {
    // 先检查是否有保存的密码
    let passphrase = repo.passphrase || ''
    if (!repo.passphraseReady) {
      let savedPassword = null
      try {
        savedPassword = await getPassword(repo.path)
      } catch {
        // ignore
      }

      if (savedPassword) {
        passphrase = savedPassword
        repo.passphrase = savedPassword
        repo.passphraseReady = true
      } else {
        // 没有保存的密码，弹出对话框
        const pwd = await promptPassword(repo)
        if (pwd === null) {
          // 用户取消
          downloading.value = ''
          return
        }
        passphrase = pwd
      }
    }

    // 获取存档列表
    const archivesRes = await borgAPI.archives(repo.path, passphrase)
    if (!archivesRes.data.archives || archivesRes.data.archives.length === 0) {
      warning('该仓库没有存档')
      downloading.value = ''
      return
    }

    // 下载第一个（最新）存档
    const res = await borgAPI.prepareDownload(repo.path, 0, passphrase)
    const url = getBorgDownloadUrl(res.data)
    const archiveName = res.data.archiveName || 'latest-archive'
    const a = document.createElement('a')
    a.href = url
    a.download = `${archiveName}.tar.gz`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err) {
    const msg = err.response?.data?.error || '准备下载失败'
    if (err.response?.status === 403 && msg.includes('密码')) {
      // 密码错误，弹出密码输入
      const pwd = await promptPassword(repo, '密码错误，请重新输入正确的密码')
      if (pwd !== null) {
        repo.passphrase = pwd
        repo.passphraseReady = true
        // 重试下载
        downloading.value = ''
        await downloadLatestArchive(repo)
        return
      }
    } else {
      error(msg)
      console.error('下载最新备份失败:', err)
    }
  } finally {
    setTimeout(() => {
      downloading.value = ''
    }, 2000)
  }
}

async function retryWithPassword(repo) {
  const pwd = await promptPassword(repo, '')
  if (pwd !== null) {
    repo.archives = null
    await loadArchives(repo)
  }
}

async function downloadAllReposWithPassword() {
  if (batchDownloading.value) return

  try {
    // 获取所有已保存密码的仓库
    const allPasswords = await getAllPasswords()
    const reposWithPassword = repos.value.filter(repo =>
      allPasswords.some(p => p.repoPath === repo.path)
    )

    if (reposWithPassword.length === 0) {
      warning('没有已保存密码的仓库')
      return
    }

    if (
      !confirm(
        `找到 ${reposWithPassword.length} 个已保存密码的仓库，确定要依次下载每个仓库的最新备份吗？`
      )
    ) {
      return
    }

    batchDownloading.value = true
    batchDownloadProgress.value = 0
    batchDownloadTotal.value = reposWithPassword.length

    for (let i = 0; i < reposWithPassword.length; i++) {
      const repo = reposWithPassword[i]
      batchDownloadProgress.value = i + 1

      try {
        // 获取保存的密码
        const password = await getPassword(repo.path)
        if (!password) {
          console.error(`仓库 ${repo.name} 没有保存的密码`)
          continue
        }

        // 获取存档列表
        const archivesRes = await borgAPI.archives(repo.path, password)
        if (
          !archivesRes.data.archives ||
          archivesRes.data.archives.length === 0
        ) {
          console.error(`仓库 ${repo.name} 没有存档`)
          continue
        }

        // 下载最新备份（第一个）
        const res = await borgAPI.prepareDownload(repo.path, 0, password)
        const url = getBorgDownloadUrl(res.data)
        const archiveName = res.data.archiveName || `${repo.name}-latest`

        const a = document.createElement('a')
        a.href = url
        a.download = `${archiveName}.tar.gz`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // 等待一小段时间避免浏览器同时下载太多
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (err) {
        console.error(`下载仓库 ${repo.name} 失败:`, err)
        const shouldContinue = confirm(
          `下载仓库 ${repo.name} 失败：${err.response?.data?.error || err.message}\n\n是否继续下载其他仓库？`
        )
        if (!shouldContinue) {
          break
        }
      }
    }

    success(
      `批量下载完成！成功: ${batchDownloadProgress.value}/${batchDownloadTotal.value}`,
      4000
    )
  } catch (err) {
    console.error('批量下载失败:', err)
    error('批量下载失败: ' + err.message)
  } finally {
    batchDownloading.value = false
    batchDownloadProgress.value = 0
    batchDownloadTotal.value = 0
  }
}
</script>
