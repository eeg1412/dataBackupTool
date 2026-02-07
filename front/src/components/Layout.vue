<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <nav
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-14 sm:h-16">
          <div class="flex items-center space-x-4 sm:space-x-8">
            <h1
              class="text-base sm:text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap"
            >
              Data Backup Tool
            </h1>
            <!-- Desktop nav -->
            <div class="hidden sm:flex space-x-1">
              <RouterLink
                v-for="link in navLinks"
                :key="link.to"
                :to="link.to"
                class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                :class="
                  $route.name === link.name
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                "
              >
                {{ link.label }}
              </RouterLink>
            </div>
          </div>
          <div class="flex items-center space-x-2 sm:space-x-3">
            <button
              @click="toggleDark"
              class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :title="isDark ? '切换亮色模式' : '切换深色模式'"
            >
              <svg
                v-if="isDark"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>
            <button
              @click="handleLogout"
              class="hidden sm:block px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              退出登录
            </button>
            <!-- Mobile hamburger -->
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="sm:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg
                v-if="!mobileMenuOpen"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <!-- Mobile menu -->
      <div
        v-if="mobileMenuOpen"
        class="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <div class="px-3 py-2 space-y-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
            :class="
              $route.name === link.name
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            "
          >
            {{ link.label }}
          </RouterLink>
          <button
            @click="handleLogout"
            class="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../api'
import { removeToken } from '../utils/auth'

const router = useRouter()
const isDark = ref(document.documentElement.classList.contains('dark'))
const mobileMenuOpen = ref(false)

const navLinks = [
  { to: '/files', name: 'Files', label: '文件管理' },
  { to: '/borg', name: 'Borg', label: 'Borg 备份' },
  { to: '/passwords', name: 'Passwords', label: '密码管理' }
]

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('darkMode', isDark.value.toString())
}

async function handleLogout() {
  try {
    await authAPI.logout()
  } catch {
    // ignore
  }
  removeToken()
  router.push({ name: 'Login' })
}
</script>
