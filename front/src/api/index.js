import axios from 'axios'

const BASE_PATH = import.meta.env.VITE_BASE_PATH || '/admin'
const API_BASE = import.meta.env.VITE_API_BASE || ''

const api = axios.create({
  // 如果 API 地址和前端地址不一致，需要设置正确的 baseURL
  // 在 Express 5 + Axios 环境下，直接拼接路径更可靠
  baseURL: API_BASE
})

api.interceptors.request.use(config => {
  // 处理 BASE_PATH 前缀
  if (
    config.url &&
    config.url.startsWith('/api') &&
    !config.url.startsWith(BASE_PATH)
  ) {
    config.url = BASE_PATH + config.url
  }

  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = BASE_PATH + '/login'
    }
    return Promise.reject(error)
  }
)

export default api
