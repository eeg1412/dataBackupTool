import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 提供前端静态文件
app.use(express.static(path.join(__dirname, 'front')))

// API 路由示例
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 单页应用 fallback - 处理所有未匹配的路由，返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'index.html'))
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log(`Frontend served from ${path.join(__dirname, 'front')}`)
})
