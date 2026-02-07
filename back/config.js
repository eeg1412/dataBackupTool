import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  // 基础配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // 后台安全路径（防止爬虫）
  adminPath: process.env.ADMIN_PATH || 'abc',

  // 备份目录配置
  borgRepoPath: process.env.BORG_REPO_PATH || '/path/to/borg/repo',
  backupDir: process.env.BACKUP_DIR || '/path/to/backup/dir',

  // 管理员凭证
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'password123',

  // CDN 配置
  useCDN: process.env.USE_CDN === 'true',

  // Telegram 配置
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',

  // 数据库
  dbPath: process.env.DB_PATH || path.join(__dirname, 'data', 'login.json'),

  // 登录安全配置
  loginFailLimit: 3, // 1小时内失败次数限制
  loginFailWindow: 60 * 60 * 1000, // 1小时时间窗口（毫秒）
  loginHistoryRetentionDays: 30 // 保留天数
}

// 验证必要的环境变量
export function validateConfig() {
  if (!config.telegramBotToken) {
    console.warn('⚠️  Warning: TELEGRAM_BOT_TOKEN not configured')
  }
  if (!config.telegramChatId) {
    console.warn('⚠️  Warning: TELEGRAM_CHAT_ID not configured')
  }
}
