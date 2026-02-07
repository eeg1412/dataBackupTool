import axios from 'axios'
import { getToken, removeToken } from '../utils/auth'
import router from '../router'

const adminPath = window.__ADMIN_PATH__ || ''
const baseURL = adminPath ? `/${adminPath}/api` : '/api'

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      removeToken()
      router.push({ name: 'Login' })
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  login(username, password, remember = false) {
    return api.post('/auth/login', { username, password, remember })
  },
  check() {
    return api.get('/auth/check')
  },
  logout() {
    return api.post('/auth/logout')
  }
}

export const filesAPI = {
  list() {
    return api.get('/files/list')
  },
  browse(dirPath) {
    return api.get('/files/browse', { params: { path: dirPath } })
  }
}

export const borgAPI = {
  repos() {
    return api.get('/borg/repos')
  },
  archives(repo, passphrase = '') {
    return api.post('/borg/archives', { repo, passphrase })
  }
}

export function getDownloadUrl(type, params) {
  const token = getToken()
  if (type === 'files') {
    return `${baseURL}/files/download?path=${encodeURIComponent(params.path)}&token=${encodeURIComponent(token)}`
  } else if (type === 'borg') {
    let url = `${baseURL}/borg/download?repo=${encodeURIComponent(params.repo)}&archive=${encodeURIComponent(params.archive)}&token=${encodeURIComponent(token)}`
    if (params.passphrase) {
      url += `&passphrase=${encodeURIComponent(params.passphrase)}`
    }
    return url
  }
  return ''
}
