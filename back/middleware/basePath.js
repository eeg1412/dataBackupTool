function basePathMiddleware(basePath) {
  return (req, res, next) => {
    // 检查请求路径是否以basePath开头
    if (!req.path.startsWith(basePath)) {
      // 类似nginx 444，直接关闭连接，不返回任何数据
      req.socket.destroy()
      return
    }

    // 移除basePath前缀，让路由正常匹配
    req.url = req.url.substring(basePath.length) || '/'
    req.baseUrl = basePath

    next()
  }
}

module.exports = basePathMiddleware
