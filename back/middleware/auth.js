import { config } from '../config.js'
import { getClientIP } from '../utils/getIP.js'
import {
  recordLoginAttempt,
  isIPBlocked,
  getFailedAttemptsCount,
  cleanOldLoginLogs
} from '../db.js'
import { notifyLoginFailure, notifyIPBlocked } from '../utils/telegram.js'

/**
 * 管理员身份验证中间件
 * 验证用户名和密码，同时检查登录失败限制
 */
export async function authMiddleware(req, res, next) {
  // 获取客户端 IP
  const clientIP = getClientIP(req)

  // 检查 IP 是否被禁止
  const blocked = isIPBlocked(clientIP)
  if (blocked) {
    console.warn(`🔒 Blocked IP attempt: ${clientIP}`)
    return res
      .status(403)
      .json({ error: 'IP blocked due to multiple failed login attempts' })
  }

  // 获取用户凭证（从请求头或请求体）
  const authHeader = req.headers.authorization || ''
  const bodyAuth = req.body?.username && req.body?.password

  let username, password

  if (authHeader.startsWith('Basic ')) {
    // 处理 Basic Auth
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
    ;[username, password] = credentials.split(':')
  } else if (bodyAuth) {
    // 处理 JSON 请求体中的凭证
    username = req.body.username
    password = req.body.password
  } else {
    // 记录登录失败
    recordLoginAttempt('unknown', clientIP, false, req.headers['user-agent'])
    return res.status(401).json({ error: 'Authentication required' })
  }

  // 验证凭证
  if (username === config.adminUsername && password === config.adminPassword) {
    // 登录成功
    recordLoginAttempt(username, clientIP, true, req.headers['user-agent'])
    // 清理旧的登录记录
    cleanOldLoginLogs()
    next()
  } else {
    // 登录失败，记录尝试
    recordLoginAttempt(
      username || 'unknown',
      clientIP,
      false,
      req.headers['user-agent']
    )

    // 获取该 IP 的失败次数
    const failCount = getFailedAttemptsCount(clientIP)

    // 发送 Telegram 通知
    if (failCount >= config.loginFailLimit) {
      notifyIPBlocked(clientIP).catch(err =>
        console.error('Error sending Telegram notification:', err)
      )
      return res.status(403).json({ error: 'Too many failed attempts' })
    } else if (failCount > 0) {
      notifyLoginFailure(clientIP, failCount).catch(err =>
        console.error('Error sending Telegram notification:', err)
      )
    }

    res.status(401).json({ error: 'Invalid credentials' })
  }
}

/**
 * 可选的令牌验证中间件（用于后续请求）
 * 简单实现，可以扩展为 JWT
 */
export function tokenAuthMiddleware(req, res, next) {
  const clientIP = getClientIP(req)

  // 检查 IP 是否被禁止（即使有有效令牌也要检查）
  const blocked = isIPBlocked(clientIP)
  if (blocked) {
    return res.status(403).json({ error: 'IP blocked' })
  }
  next()
}
