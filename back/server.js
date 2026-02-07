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

// 创建路由器
const router = express.Router()

// API路由
// 在 Express 5 中，为了确保前缀匹配工作正常，我们可以使用通配符 (.*)
// 或者嵌套多个路径。对于 .use 来说，字符串前缀通常仍然有效，但为了万无一失：
router.use('/api', authRoutes)
router.use('/api', apiRoutes)
router.use('/api', downloadRoutes)

// 静态文件服务（前端）
const frontDir = path.join(__dirname, 'front')
try {
  router.use(express.static(frontDir))
} catch (err) {
  console.error('Error serving static files:', err.message)
}

// SPA路由支持 - Express 5 不再支持之前的正则表达式字符串。
// 使用 RegExp 对象的字面量形式是最稳健的跨版本方案
router.get(/^(?!\/api).*$/, (req, res) => {
  try {
    res.sendFile(path.join(frontDir, 'index.html'))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 将路由挂载到BASE_PATH下
// 显式支持 /admin 和 /admin/*
app.use(BASE_PATH, router)

// 对于不匹配BASE_PATH的请求，返回404，并打印详细信息用于调试
app.use((req, res) => {
  console.warn(`[404] No match for: ${req.method} ${req.url}`)
  res.status(404).json({
    error: 'Not Found',
    path: req.url,
    method: req.method,
    basePath: BASE_PATH
  })
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
