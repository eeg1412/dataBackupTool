const express = require('express')
const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const authMiddleware = require('../middleware/auth')
const { zipSync } = require('fflate')

const router = express.Router()

async function getDirectoryFiles(dirPath, basePath = '') {
  const files = {}
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const zipPath = path.posix.join(basePath, entry.name)

    if (entry.isDirectory()) {
      const subFiles = await getDirectoryFiles(fullPath, zipPath)
      Object.assign(files, subFiles)
    } else if (entry.isFile()) {
      const fileData = await fs.promises.readFile(fullPath)
      files[zipPath] = fileData
    }
  }

  return files
}

router.get('/download', authMiddleware, async (req, res) => {
  const { type, path: dirPath } = req.query

  if (!dirPath) {
    return res.status(400).json({ message: '未指定目录' })
  }

  try {
    // 验证路径是否在允许的目录下
    const rawBase =
      type === 'borg' ? process.env.BORG_DIR : process.env.NORMAL_DIR

    if (!rawBase) {
      return res.status(400).json({ message: '目录配置不存在' })
    }

    // 统一路径格式，处理 .env 中的转义问题
    const sanitize = p =>
      path.normalize(p.replace(/\\/g, '/').replace(/\/+/g, '/'))

    const baseDir = sanitize(rawBase)
    const normalizedPath = sanitize(dirPath)

    if (!normalizedPath.startsWith(baseDir)) {
      console.warn(
        `[Download] Security Block: ${normalizedPath} is not within ${baseDir}`
      )
      return res.status(403).json({ message: '无权限访问该目录' })
    }

    // 检查目录是否存在
    const stats = await fs.promises.stat(normalizedPath)
    if (!stats.isDirectory()) {
      return res.status(400).json({ message: '指定路径不是目录' })
    }

    const dirName = path.basename(normalizedPath)
    const fileName = `${dirName}.zip`

    // 获取目录下的所有文件
    const files = await getDirectoryFiles(normalizedPath, dirName)

    // 创建zip
    const zipped = zipSync(files, { level: 6 })

    // 设置响应头
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`
    )
    res.setHeader('Content-Length', zipped.length)

    // 发送zip数据
    res.send(Buffer.from(zipped))
  } catch (error) {
    console.error('Error creating zip:', error)
    if (!res.headersSent) {
      res.status(500).json({ message: '创建压缩包失败' })
    }
  }
})

module.exports = router
