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
  },
  loginRecords(page = 1, pageSize = 50) {
    return api.get('/auth/login-records', { params: { page, pageSize } })
  },
  /** 获取短时效下载 token（5分钟有效） */
  getDownloadToken() {
    return api.post('/auth/download-token')
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
  },
  /** 准备下载：传入 repo + 存档序号 + 密码，返回含加密信息的短效 token */
  prepareDownload(repo, archiveIndex, passphrase = '') {
    return api.post('/borg/prepare-download', { repo, archiveIndex, passphrase })
  }
}

export function getFileDownloadUrl(filePath, downloadToken) {
  const token = downloadToken || getToken()
  return `${baseURL}/files/download?path=${encodeURIComponent(filePath)}&token=${encodeURIComponent(token)}`
}

export function getBorgDownloadUrl(borgToken) {
  return `${baseURL}/borg/download?token=${encodeURIComponent(borgToken)}`
}

/**
 * 获取文件下载的安全 URL（使用短效 token）
 */
export async function getSecureFileDownloadUrl(filePath) {
  const res = await authAPI.getDownloadToken()
  return getFileDownloadUrl(filePath, res.data.token)
}
