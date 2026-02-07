import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { config, validateConfig } from './config.js'
import { initDatabase, closeDatabase } from './db.js'
import {
  pathVerifyMiddleware,
  apiPathVerifyMiddleware
} from './middleware/pathVerify.js'
import { authMiddleware, tokenAuthMiddleware } from './middleware/auth.js'
import { getClientIP } from './utils/getIP.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// 验证环境变量配置
validateConfig()

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🚀 数据备份工具后台服务启动')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`📝 管理后台路径: /${config.adminPath}`)
console.log(`🔐 安全路径前缀已启用`)
console.log(`🗄️  Borg 仓库: ${config.borgRepoPath}`)
console.log(`📂 备份目录: ${config.backupDir}`)

// 中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志中间件
app.use((req, res, next) => {
  const clientIP = getClientIP(req)
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.path} - ${clientIP}`
  )
  next()
})

// ============ 不需要路径验证的路由 ============

// 提供前端静态文件（仅在根路径）
app.use(express.static(path.join(__dirname, 'front')))

// 根路由 - 返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'index.html'))
})

// ============ 需要路径验证的路由 ============

// 路径验证中间件（仅应用于 API 和管理路由）
app.use(`/${config.adminPath}`, pathVerifyMiddleware)

// 登录端点（第一次认证）
app.post(`/${config.adminPath}/api/login`, authMiddleware, (req, res) => {
  res.json({
    status: 'success',
    message: '登录成功',
    timestamp: new Date().toISOString()
  })
})

// 健康检查（需要验证）
app.get(`/${config.adminPath}/api/health`, tokenAuthMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    adminPath: config.adminPath,
    timestamp: new Date().toISOString()
  })
})

// 获取备份配置（需要验证）
app.get(`/${config.adminPath}/api/config`, tokenAuthMiddleware, (req, res) => {
  res.json({
    adminPath: config.adminPath,
    borgRepoPath: config.borgRepoPath,
    backupDir: config.backupDir,
    useCDN: config.useCDN
  })
})

// ============ SPA fallback ============

// 前端路由 - SPA 处理
app.get(`/${config.adminPath}`, (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'index.html'))
})

// 使用正则表达式处理 SPA 所有子路由
app.get(new RegExp(`^/${config.adminPath}/`), (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'index.html'))
})

// ============ 错误处理 ============

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// 404 处理 - 必须放在最后
app.use((req, res) => {
  // 如果请求路径不在允许列表中，返回 444
  if (!req.path.startsWith(`/${config.adminPath}`) && req.path !== '/') {
    return res.status(444).end()
  }
  res.status(404).json({ error: 'Not Found' })
})

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase()

    app.listen(config.port, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`✅ 服务器运行在 http://localhost:${config.port}`)
      console.log(
        `🌐 前端路径: http://localhost:${config.port}/${config.adminPath}`
      )
      console.log(`📡 API 基础路径: /${config.adminPath}/api/*`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })
  } catch (err) {
    console.error('❌ 服务器启动失败:', err)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...')
  await closeDatabase()
  process.exit(0)
})

startServer()
