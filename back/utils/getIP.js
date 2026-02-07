import { config } from '../config.js'

/**
 * 获取客户端真实 IP
 * @param {Object} req - Express request 对象
 * @returns {string} 客户端 IP 地址
 */
export function getClientIP(req) {
  if (config.useCDN) {
    // 优先使用 Cloudflare 的 IP 头
    const cfIP = req.headers['cf-connecting-ip']
    if (cfIP) return cfIP

    // 其次尝试其他常见的代理 IP 头
    const xRealIP = req.headers['x-real-ip']
    if (xRealIP) return xRealIP

    const xForwardedFor = req.headers['x-forwarded-for']
    if (xForwardedFor) {
      // X-Forwarded-For 可能包含多个 IP，取第一个
      return xForwardedFor.split(',')[0].trim()
    }
  }

  // 直接使用请求的 IP
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  )
}
