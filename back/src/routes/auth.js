import { Router } from 'express'
import crypto from 'crypto'
import { config } from '../config.js'
import { generateToken, verifyToken } from '../middleware/auth.js'
import { getClientIP } from '../utils/ip.js'
import {
  addRecord,
  isIPBlocked,
  getRecentFailureCount,
  cleanOldRecords
} from '../utils/loginRecords.js'
import { sendTelegramMessage } from '../utils/telegram.js'

const router = Router()

/**
 * 常量时间比较，防止时序攻击。
 * 先将两个字符串哈希为等长摘要再比较，避免长度泄露。
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const hashA = crypto.createHash('sha256').update(a).digest()
  const hashB = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

/**
 * HTML 实体转义，用于 Telegram 消息
 */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

router.post('/login', async (req, res) => {
  const { username, password, remember } = req.body
  const ip = getClientIP(req)

  // 验证请求体
  if (
    !username ||
    !password ||
    typeof username !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({ error: '请提供用户名和密码' })
  }

  // 检查 IP 是否被封禁
  if (isIPBlocked(ip)) {
    return res
      .status(403)
      .json({ error: '由于多次登录失败，该IP已被暂时封禁，请1小时后再试' })
  }

  // 验证凭证
  const usernameMatch = safeCompare(username, config.adminUsername)
  const passwordMatch = safeCompare(password, config.adminPassword)

  if (!usernameMatch || !passwordMatch) {
    // 记录失败
    await addRecord({ username, ip, success: false })

    const failCount = getRecentFailureCount(ip)
    if (failCount >= 3) {
      // 发送 Telegram 通知
      const msg =
        `⚠️ <b>安全告警</b>\n\n` +
        `IP <code>${escapeHTML(ip)}</code> 在1小时内登录失败 ${failCount} 次，已被封禁。\n` +
        `最近尝试的用户名: <code>${escapeHTML(username.slice(0, 30))}</code>\n` +
        `时间: ${new Date().toISOString()}`
      sendTelegramMessage(msg).catch(() => {})
    }

    return res.status(401).json({ error: '用户名或密码错误' })
  }

  // 登录成功
  await addRecord({ username, ip, success: true })

  // 清理旧记录
  cleanOldRecords().catch(() => {})

  // 生成 JWT
  const token = generateToken({ username, loginTime: Date.now() }, !!remember)

  res.json({
    token,
    message: '登录成功'
  })
})

router.get('/check', (req, res) => {
  let token = null
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '认证已过期' })
  }

  res.json({ valid: true, username: payload.username })
})

router.post('/logout', (_req, res) => {
  // JWT 无状态，客户端删除即可
  res.json({ message: '已退出登录' })
})

export default router
