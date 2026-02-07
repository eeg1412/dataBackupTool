const express = require('express')
const fs = require('fs').promises
const path = require('path')
const authMiddleware = require('../middleware/auth')
const { getRecentLogs } = require('../utils/loginLogs')

const router = express.Router()

// 获取统计信息
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = {
      totalBackups: 0,
      repositories: 0,
      totalSize: '0 GB'
    }

    // 这里可以根据实际情况计算统计信息
    res.json(stats)
  } catch (error) {
    res.status(500).json({ message: '获取统计信息失败' })
  }
})

// 获取登录日志
router.get('/login-logs', authMiddleware, async (req, res) => {
  try {
    const logs = await getRecentLogs(50)
    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: '获取登录日志失败' })
  }
})

// 获取目录列表
router.get('/directories', authMiddleware, async (req, res) => {
  const { type } = req.query

  try {
    let rawPath =
      type === 'borg' ? process.env.BORG_DIR : process.env.NORMAL_DIR

    if (!rawPath) {
      console.warn(
        `[Config] Directory for type "${type}" is not defined in .env`
      )
      return res.json([])
    }

    // 处理 Windows 路径常见的 .env 转义问题
    // 1. 如果路径被 dotenv 误解析（例如 "...\test" 中的 \t 变成 tab）
    // 2. 如果路径包含双反斜杠 \\
    let baseDir = rawPath.replace(/\\/g, '/').replace(/\/+/g, '/')
    baseDir = path.normalize(baseDir)

    console.log(
      `[API] Listing directories in: ${baseDir} (original: ${rawPath})`
    )

    // 检查目录是否存在
    try {
      const stats = await fs.stat(baseDir)
      if (!stats.isDirectory()) {
        console.warn(`[API] Path is not a directory: ${baseDir}`)
        return res.json([])
      }
    } catch (err) {
      console.error(
        `[API] Path does not exist or access denied: ${baseDir}`,
        err.message
      )
      return res.json([])
    }

    const entries = await fs.readdir(baseDir, { withFileTypes: true })
    const directories = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(baseDir, entry.name))

    res.json(directories)
  } catch (error) {
    console.error('[API] Error reading directories:', error)
    res.json([])
  }
})

module.exports = router
