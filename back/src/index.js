import express from 'express'
import helmet from 'helmet'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { securityMiddleware } from './middleware/security.js'
import authRoutes from './routes/auth.js'
import filesRoutes from './routes/files.js'
import borgRoutes from './routes/borg.js'
import { initLoginRecords } from './utils/loginRecords.js'
import { initJWTKeys } from './utils/jwt.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// 安全 HTTP 头
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
)

// 禁止暴露服务器信息
app.disable('x-powered-by')

// Body 解析
app.use(express.json({ limit: '1mb' }))

// 安全路径中间件 — 任何不匹配 ADMIN_PATH 的请求直接关闭连接
app.use(securityMiddleware)

// API 路由
const apiRouter = express.Router()
apiRouter.use('/auth', authRoutes)
apiRouter.use('/files', filesRoutes)
apiRouter.use('/borg', borgRoutes)
// API 404 处理 - 未匹配的 API 路由返回 JSON 而非 HTML
apiRouter.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' })
})
app.use(`/${config.adminPath}/api`, apiRouter)

// 静态文件（前端构建产物）
const staticDir = path.join(__dirname, '../front')
app.use(
  `/${config.adminPath}`,
  express.static(staticDir, {
    index: false, // 不自动返回 index.html，由 SPA fallback 处理
    dotfiles: 'ignore',
    maxAge: '1d'
  })
)

// SPA fallback — 所有非 API、非静态文件请求返回 index.html（注入 ADMIN_PATH）
const indexPath = path.join(staticDir, 'index.html')

// 缓存注入后的 HTML
let cachedHTML = null
function getInjectedHTML() {
  if (cachedHTML) return cachedHTML
  if (!fs.existsSync(indexPath)) return null
  let html = fs.readFileSync(indexPath, 'utf-8')
  // 对 adminPath 进行转义防止 XSS
  html = html.replace(
    '</head>',
    `<script>window.__ADMIN_PATH__=${JSON.stringify(config.adminPath)};</script></head>`
  )
  cachedHTML = html
  return html
}

app.use(`/${config.adminPath}`, (req, res, next) => {
  // 跳过 API 路由（不应到达这里，但以防万一）
  if (req.path.startsWith('/api')) return next()

  // 有文件扩展名的请求是缺失的静态文件
  if (path.extname(req.path)) {
    return res.status(404).end()
  }

  const html = getInjectedHTML()
  if (!html) {
    return res.status(503).json({ error: '前端尚未构建，请先执行 yarn build' })
  }

  res.type('html').send(html)
})

// 全局错误处理
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err)
  if (!res.headersSent) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 启动
async function start() {
  await initJWTKeys()
  await initLoginRecords()

  app.listen(config.port, () => {
    console.log(`\n=================================`)
    console.log(`  Data Backup Tool 已启动`)
    console.log(`  端口: ${config.port}`)
    console.log(
      `  访问路径: http://localhost:${config.port}/${config.adminPath}/`
    )
    console.log(`=================================\n`)
  })
}

start().catch(err => {
  console.error('[FATAL] 启动失败:', err)
  process.exit(1)
})
