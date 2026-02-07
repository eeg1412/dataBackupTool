import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { config } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let loginLogs = []

// 初始化数据库
export async function initDatabase() {
  const dir = path.dirname(config.dbPath)

  // 确保数据目录存在
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // 尝试加载现有日志
  try {
    if (fs.existsSync(config.dbPath)) {
      const data = fs.readFileSync(config.dbPath, 'utf-8')
      loginLogs = JSON.parse(data)
      console.log(
        `✅ Loaded ${loginLogs.length} login logs from ${config.dbPath}`
      )
    } else {
      loginLogs = []
      saveLoginLogs()
      console.log(`✅ Created new login log file at ${config.dbPath}`)
    }
  } catch (err) {
    console.error('❌ Error loading login logs:', err)
    loginLogs = []
    saveLoginLogs()
  }
}

// 保存登录日志到文件
function saveLoginLogs() {
  try {
    const dir = path.dirname(config.dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(config.dbPath, JSON.stringify(loginLogs, null, 2))
  } catch (err) {
    console.error('Error saving login logs:', err)
  }
}

// 记录登录尝试
export function recordLoginAttempt(username, ip, success, userAgent = '') {
  const record = {
    id: loginLogs.length + 1,
    username,
    ip,
    success: success ? 1 : 0,
    timestamp: new Date().toISOString(),
    user_agent: userAgent
  }

  loginLogs.push(record)
  saveLoginLogs()
  return record.id
}

// 获取特定 IP 在时间窗口内的失败次数
export function getFailedAttemptsCount(ip, windowMs = config.loginFailWindow) {
  const startTime = new Date(Date.now() - windowMs)
  return loginLogs.filter(
    log =>
      log.ip === ip && log.success === 0 && new Date(log.timestamp) > startTime
  ).length
}

// 检查 IP 是否被禁止登录
export function isIPBlocked(ip) {
  return getFailedAttemptsCount(ip) >= config.loginFailLimit
}

// 清理旧的登录记录
export function cleanOldLoginLogs() {
  const retentionDate = new Date(
    Date.now() - config.loginHistoryRetentionDays * 24 * 60 * 60 * 1000
  )

  const beforeCount = loginLogs.length
  loginLogs = loginLogs.filter(log => new Date(log.timestamp) >= retentionDate)
  const deletedCount = beforeCount - loginLogs.length

  if (deletedCount > 0) {
    saveLoginLogs()
    console.log(`🧹 Cleaned ${deletedCount} old login records`)
  }

  return deletedCount
}

// 获取登录统计
export function getLoginStats(ip, hoursBack = 24) {
  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
  const relevantLogs = loginLogs.filter(
    log => log.ip === ip && new Date(log.timestamp) > startTime
  )

  return {
    total: relevantLogs.length,
    successCount: relevantLogs.filter(l => l.success === 1).length,
    failCount: relevantLogs.filter(l => l.success === 0).length
  }
}

// 获取所有登录日志
export function getAllLoginLogs() {
  return loginLogs
}

// 清空所有日志
export function clearAllLoginLogs() {
  loginLogs = []
  saveLoginLogs()
}

// 删除特定 IP 的记录
export function deleteLogsForIP(ip) {
  const beforeCount = loginLogs.length
  loginLogs = loginLogs.filter(log => log.ip !== ip)
  const deletedCount = beforeCount - loginLogs.length

  if (deletedCount > 0) {
    saveLoginLogs()
  }

  return deletedCount
}

// 关闭数据库（JSON 不需要，但保留接口）
export async function closeDatabase() {
  // JSON 文件自动保存，无需特殊处理
  console.log('📦 Login logs saved')
}
