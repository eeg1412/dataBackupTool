import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function requireEnv(name) {
  const val = process.env[name]
  if (!val || val.trim() === '') {
    console.error(`[FATAL] 环境变量 ${name} 未设置。请参考 .env.example 配置。`)
    process.exit(1)
  }
  return val.trim()
}

function parseList(val) {
  if (!val || val.trim() === '') return []
  return val
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

const adminPath = requireEnv('ADMIN_PATH')

if (!/^[a-zA-Z0-9_\-]+$/.test(adminPath)) {
  console.error('[FATAL] ADMIN_PATH 只允许包含字母、数字、下划线和连字符。')
  process.exit(1)
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  adminPath,
  adminUsername: requireEnv('ADMIN_USERNAME'),
  adminPassword: requireEnv('ADMIN_PASSWORD'),
  normalDirs: parseList(process.env.NORMAL_DIRS),
  borgRepos: parseList(process.env.BORG_REPOS),
  isCDN: process.env.IS_CDN === 'true',
  telegramToken: (process.env.TELEGRAM_TOKEN || '').trim(),
  telegramChatId: (process.env.TELEGRAM_CHAT_ID || '').trim(),
  dataDir: path.resolve(__dirname, '../data')
}
