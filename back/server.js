require('dotenv').config({ path: __dirname + '/.env' })
const express = require('express')
const path = require('path')
const authRoutes = require('./routes/auth')
const apiRoutes = require('./routes/api')
const downloadRoutes = require('./routes/download')

const app = express()
const PORT = process.env.PORT || 3000
const BASE_PATH = process.env.BASE_PATH || '/admin'

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// 基础中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务 - 应该在 API 之前还是之后？通常在 API 之后或通过特定路径。
// 为了配合 BASE_PATH，我们将所有内容直接挂载在 app 上。
const frontDir = path.join(__dirname, 'front')

// API 路由 - 直接挂载在 app 上，避免嵌套 router 的不确定性
app.use(`${BASE_PATH}/api`, authRoutes)
app.use(`${BASE_PATH}/api`, apiRoutes)
app.use(`${BASE_PATH}/api`, downloadRoutes)

// 静态文件服务
try {
  app.use(BASE_PATH, express.static(frontDir))
} catch (err) {
  console.error('Error serving static files:', err.message)
}

// SPA 路由支持 - 在 Express 5 中，正则表达式字面量是安全的
// 捕获所有不以 /api 开头的请求
app.get(new RegExp(`^${BASE_PATH}(?!/api).*$`), (req, res) => {
  res.sendFile(path.join(frontDir, 'index.html'))
})

// 对于不匹配的所有请求，返回 404
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.url}`)
  res.status(404).json({ error: 'Not Found', path: req.url })
})

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Base path: ${BASE_PATH}`)
  console.log(`Access URL: http://localhost:${PORT}${BASE_PATH}`)
})

// 错误处理
server.on('error', err => {
  console.error('Server error:', err)
  process.exit(1)
})
