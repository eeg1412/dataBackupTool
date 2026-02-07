import jwt from 'jsonwebtoken'
import { getPrivateKey, getPublicKey } from '../utils/jwt.js'

export function generateToken(payload, remember = false) {
  const expiresIn = remember ? '365d' : '24h'
  return jwt.sign(payload, getPrivateKey(), { algorithm: 'RS256', expiresIn })
}

/**
 * 生成短时效下载专用 token（5分钟有效）
 */
export function generateDownloadToken(payload) {
  return jwt.sign({ ...payload, purpose: 'download' }, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: '5m'
  })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] })
  } catch {
    return null
  }
}

export function authMiddleware(req, res, next) {
  let token = null

  // 从 Authorization header 获取
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }

  if (!token) {
    return res.status(401).json({ error: '需要身份认证' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '认证已过期或无效' })
  }

  req.user = payload
  next()
}

/**
 * 下载专用认证中间件，支持 query 参数中的 token（因为浏览器下载无法设置 header）
 */
export function downloadAuthMiddleware(req, res, next) {
  let token = null

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }

  // 仅下载路由允许 query 参数 token
  if (!token && req.query && req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: '需要身份认证' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '认证已过期或无效' })
  }

  req.user = payload
  next()
}
