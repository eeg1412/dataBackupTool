const fs = require('fs').promises
const path = require('path')

const LOGIN_LOG_FILE = path.join(__dirname, '../login-logs.json')

async function readLoginLogs() {
  try {
    const data = await fs.readFile(LOGIN_LOG_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

async function writeLoginLogs(logs) {
  await fs.writeFile(LOGIN_LOG_FILE, JSON.stringify(logs, null, 2))
}

async function cleanOldLogs() {
  const logs = await readLoginLogs()
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const cleanedLogs = logs.filter(log => log.timestamp > thirtyDaysAgo)

  if (cleanedLogs.length !== logs.length) {
    await writeLoginLogs(cleanedLogs)
  }

  return cleanedLogs
}

async function addLoginLog(username, ip, success) {
  await cleanOldLogs()
  const logs = await readLoginLogs()

  logs.push({
    timestamp: Date.now(),
    username,
    ip,
    success
  })

  await writeLoginLogs(logs)
}

async function checkIPBlocked(ip) {
  const logs = await readLoginLogs()
  const oneHourAgo = Date.now() - 60 * 60 * 1000

  const recentFailures = logs.filter(
    log => log.ip === ip && !log.success && log.timestamp > oneHourAgo
  )

  return recentFailures.length >= 3
}

async function getRecentLogs(limit = 50) {
  const logs = await readLoginLogs()
  return logs.slice(-limit).reverse()
}

module.exports = {
  addLoginLog,
  checkIPBlocked,
  getRecentLogs,
  cleanOldLogs
}
