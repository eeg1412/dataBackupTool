import fs from 'fs'
import path from 'path'
import { config } from '../config.js'

const RECORDS_FILE = path.join(config.dataDir, 'login-records.json')
const MAX_RECORDS = 10000

let records = []
let writeQueue = Promise.resolve()

export async function initLoginRecords() {
  // 确保 data 目录存在
  try {
    await fs.promises.mkdir(config.dataDir, { recursive: true })
  } catch {
    // ignore
  }

  try {
    const data = await fs.promises.readFile(RECORDS_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    records = Array.isArray(parsed.records) ? parsed.records : []
  } catch {
    records = []
  }
}

function enqueueSave() {
  writeQueue = writeQueue
    .then(() =>
      fs.promises.writeFile(
        RECORDS_FILE,
        JSON.stringify({ records }, null, 2),
        'utf-8'
      )
    )
    .catch(err => {
      console.error('[LoginRecords] 保存失败:', err.message)
    })
  return writeQueue
}

export async function addRecord(record) {
  records.push({
    timestamp: new Date().toISOString(),
    username: String(record.username || '').slice(0, 100),
    ip: String(record.ip || 'unknown').slice(0, 45),
    success: !!record.success
  })

  // 防止内存无限增长
  if (records.length > MAX_RECORDS) {
    records = records.slice(-MAX_RECORDS)
  }

  return enqueueSave()
}

/**
 * 获取指定IP在最近1小时内的失败登录次数
 */
export function getRecentFailureCount(ip) {
  const oneHourAgo = Date.now() - 3600000
  return records.filter(
    r =>
      r.ip === ip && !r.success && new Date(r.timestamp).getTime() > oneHourAgo
  ).length
}

/**
 * 检查指定IP是否被封禁（1小时内失败3次）
 */
export function isIPBlocked(ip) {
  return getRecentFailureCount(ip) >= 3
}

/**
 * 清理30天前的记录
 */
export async function cleanOldRecords() {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600000
  const before = records.length
  records = records.filter(r => new Date(r.timestamp).getTime() > thirtyDaysAgo)
  if (records.length !== before) {
    return enqueueSave()
  }
}
