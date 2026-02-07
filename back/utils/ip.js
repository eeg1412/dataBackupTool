function getClientIP(req, useCDN) {
  let ip = ''

  if (useCDN) {
    // 从CDN代理头获取真实IP
    ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.headers['cf-connecting-ip'] ||
      req.socket.remoteAddress
  } else {
    ip = req.socket.remoteAddress || req.connection.remoteAddress
  }

  // 处理IPv6的localhost地址
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1'
  }

  // 移除IPv6前缀
  if (ip && ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }

  return ip || '127.0.0.1'
}

module.exports = {
  getClientIP
}
