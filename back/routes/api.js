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
    const baseDir =
      type === 'borg' ? process.env.BORG_DIR : process.env.NORMAL_DIR

    if (!baseDir) {
      return res.json([])
    }

    // 检查目录是否存在
    try {
      const stats = await fs.stat(baseDir)
      if (!stats.isDirectory()) {
        console.log(`Path is not a directory: ${baseDir}`)
        return res.json([])
      }
    } catch (err) {
      console.log(`Directory does not exist: ${baseDir}`)
      return res.json([])
    }

    const entries = await fs.readdir(baseDir, { withFileTypes: true })
    const directories = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(baseDir, entry.name))

    res.json(directories)
  } catch (error) {
    console.error('Error reading directories:', error)
    res.json([])
  }
})

module.exports = router
