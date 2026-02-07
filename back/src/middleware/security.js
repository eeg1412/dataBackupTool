import { config } from '../config.js'

export function securityMiddleware(req, res, next) {
  const adminPrefix = `/${config.adminPath}`

  if (req.path === adminPrefix || req.path.startsWith(`${adminPrefix}/`)) {
    next()
  } else {
    // 类似 nginx 444，直接关闭连接，不返回任何数据
    req.socket.destroy()
  }
}
