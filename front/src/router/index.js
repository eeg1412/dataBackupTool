import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../utils/auth'

const adminPath = window.__ADMIN_PATH__ || ''
const base = adminPath ? `/${adminPath}/` : '/'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    redirect: '/files'
  },
  {
    path: '/files',
    name: 'Files',
    component: () => import('../views/Files.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/borg',
    name: 'Borg',
    component: () => import('../views/Borg.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/passwords',
    name: 'Passwords',
    component: () => import('../views/Passwords.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login-records',
    name: 'LoginRecords',
    component: () => import('../views/LoginRecords.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(base),
  routes
})

router.beforeEach((to, from, next) => {
  const token = getToken()
  if (to.meta.requiresAuth !== false && !token) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && token) {
    next({ name: 'Files' })
  } else {
    next()
  }
})

export default router
