/**
 * API 工具函数
 * 所有 API 调用都会自动添加安全路径前缀
 */

const ADMIN_PATH = 'abc'
const API_BASE = `/${ADMIN_PATH}/api`

/**
 * 发送 API 请求
 * @param {string} endpoint - API 端点（例如: '/login', '/health'）
 * @param {Object} options - 请求选项（method, body 等）
 * @returns {Promise<any>} API 响应
 */
export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`

  const defaultHeaders = {
    'Content-Type': 'application/json'
  }

  const response = await fetch(url, {
    headers: defaultHeaders,
    ...options
  })

  // 如果响应不是 JSON，返回原始响应
  const contentType = response.headers.get('content-type')
  let data

  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  // 处理错误响应
  if (!response.ok) {
    const error = new Error(data.error || `HTTP Error: ${response.status}`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

/**
 * 登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<any>} 登录响应
 */
export async function login(username, password) {
  return apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

/**
 * 获取健康状态
 * @returns {Promise<any>} 健康状态响应
 */
export async function getHealth() {
  return apiCall('/health', {
    method: 'GET'
  })
}

/**
 * 获取备份配置
 * @returns {Promise<any>} 备份配置
 */
export async function getConfig() {
  return apiCall('/config', {
    method: 'GET'
  })
}

export { ADMIN_PATH, API_BASE }
