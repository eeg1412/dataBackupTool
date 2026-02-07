import { config } from '../config.js'

export function getClientIP(req) {
  if (config.isCDN) {
    const forwarded = req.headers['x-forwarded-for']
    if (forwarded) {
      // 取第一个IP（最原始的客户端IP）
      const first = forwarded.split(',')[0].trim()
      if (first) return first
    }
    // Cloudflare
    if (req.headers['cf-connecting-ip']) {
      return req.headers['cf-connecting-ip']
    }
    // X-Real-IP (Nginx)
    if (req.headers['x-real-ip']) {
      return req.headers['x-real-ip']
    }
  }
  // 直连场景
  return req.ip || req.socket?.remoteAddress || 'unknown'
}
