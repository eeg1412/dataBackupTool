import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { config } from '../config.js'
import { authMiddleware, downloadAuthMiddleware } from '../middleware/auth.js'
import { sendTelegramMessage } from '../utils/telegram.js'
import { getClientIP } from '../utils/ip.js'

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const router = Router()

/**
 * 验证请求的路径是否在允许的目录列表内（防止目录遍历和符号链接绕过）
 */
async function isPathAllowed(requestedPath, allowedDirs) {
  if (!requestedPath || typeof requestedPath !== 'string') return false
  try {
    // 使用 realpath 解析符号链接，防止通过符号链接访问受限目录外的文件
    const resolved = await fs.promises.realpath(requestedPath)
    for (const dir of allowedDirs) {
      let resolvedDir
      try {
        resolvedDir = await fs.promises.realpath(dir)
      } catch {
        resolvedDir = path.resolve(dir)
      }
      if (
        resolved === resolvedDir ||
        resolved.startsWith(resolvedDir + path.sep)
      ) {
        return true
      }
    }
  } catch {
    // realpath 失败说明路径不存在
    return false
  }
  return false
}

/**
 * 列出所有配置的普通目录
 */
router.get('/list', authMiddleware, (_req, res) => {
  const directories = config.normalDirs.map(dir => ({
    path: dir,
    name: path.basename(dir)
  }))
  res.json({ directories })
})

/**
 * 浏览指定目录的内容
 */
router.get('/browse', authMiddleware, async (req, res) => {
  const requestedPath = req.query.path

  if (!requestedPath) {
    return res.status(400).json({ error: '请指定目录路径' })
  }

  if (!(await isPathAllowed(requestedPath, config.normalDirs))) {
    return res.status(403).json({ error: '无权访问此目录' })
  }

  try {
    const stat = await fs.promises.stat(requestedPath)
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: '指定路径不是目录' })
    }

    const entries = await fs.promises.readdir(requestedPath, {
      withFileTypes: true
    })
    const items = entries
      .filter(e => !e.name.startsWith('.'))
      .map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(requestedPath, entry.name)
      }))

    res.json({ items, currentPath: requestedPath })
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: '目录不存在' })
    }
    if (err.code === 'EACCES') {
      return res.status(403).json({ error: '没有权限读取此目录' })
    }
    console.error('[Files] 浏览目录失败:', err.message)
    res.status(500).json({ error: '读取目录失败' })
  }
})

/**
 * 以 ZIP 流的形式下载指定目录
 */
router.get('/download', downloadAuthMiddleware, async (req, res) => {
  const requestedPath = req.query.path

  if (!requestedPath) {
    return res.status(400).json({ error: '请指定目录路径' })
  }

  if (!(await isPathAllowed(requestedPath, config.normalDirs))) {
    return res.status(403).json({ error: '无权访问此目录' })
  }

  try {
    const stat = await fs.promises.stat(requestedPath)
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: '指定路径不是目录' })
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: '目录不存在' })
    }
    return res.status(500).json({ error: '无法访问目录' })
  }

  const dirName = path.basename(requestedPath) || 'download'

  // 使用 RFC 5987 编码支持中文文件名
  const encodedName = encodeURIComponent(dirName)
  const asciiFallback = dirName.replace(/[^\x20-\x7E]/g, '_')

  // Telegram 通知
  const ip = getClientIP(req)
  const downloadStartTime = Date.now()
  sendTelegramMessage(
    `⬇️ <b>下载文件目录</b>\n目录: <code>${escapeHTML(requestedPath)}</code>\nIP: <code>${escapeHTML(ip)}</code>\n时间: ${new Date().toLocaleString('zh-CN')}`
  ).catch(() => {})

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallback}.zip"; filename*=UTF-8''${encodedName}.zip`
  )
  res.setHeader('Transfer-Encoding', 'chunked')
  // 禁用代理缓冲确保流式传输
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Cache-Control', 'no-cache')

  try {
    // 动态导入 @zip.js/zip.js
    const { ZipWriter } = await import('@zip.js/zip.js')

    const { readable, writable } = new TransformStream()
    const zipWriter = new ZipWriter(writable)

    // 将 Web ReadableStream 转换为 Node Readable 并 pipe 到 response
    const nodeStream = Readable.fromWeb(readable)
    nodeStream.pipe(res)

    // 处理客户端断开连接
    let aborted = false
    req.on('close', () => {
      if (!aborted) {
        aborted = true
        console.log('[Files] 客户端断开，清理 ZIP 流')
        nodeStream.unpipe(res)
        nodeStream.destroy()
      }
    })

    // 递归添加文件到 ZIP
    async function addDirectory(dirPath, zipPath) {
      if (aborted) return

      let entries
      try {
        entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
      } catch {
        return // 跳过无法读取的目录
      }

      for (const entry of entries) {
        if (aborted) return
        if (entry.name.startsWith('.')) continue

        const fullPath = path.join(dirPath, entry.name)
        const entryZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name

        if (entry.isDirectory()) {
          await addDirectory(fullPath, entryZipPath)
        } else {
          try {
            const fileStream = fs.createReadStream(fullPath)
            const webStream = Readable.toWeb(fileStream)
            await zipWriter.add(entryZipPath, webStream)
          } catch {
            // 跳过无法读取的文件
          }
        }
      }
    }

    await addDirectory(requestedPath, '')
    await zipWriter.close()

    // 下载成功通知
    const duration = ((Date.now() - downloadStartTime) / 1000).toFixed(1)
    sendTelegramMessage(
      `✅ <b>文件目录下载完成</b>\n目录: <code>${escapeHTML(requestedPath)}</code>\n耗时: ${duration}秒\nIP: <code>${escapeHTML(ip)}</code>`
    ).catch(() => {})
  } catch (err) {
    console.error('[Files] ZIP 打包失败:', err.message)

    // 下载失败通知
    sendTelegramMessage(
      `❌ <b>文件目录下载失败</b>\n目录: <code>${escapeHTML(requestedPath)}</code>\n错误: ${escapeHTML(err.message)}\nIP: <code>${escapeHTML(ip)}</code>`
    ).catch(() => {})
    if (!res.headersSent) {
      res.status(500).json({ error: '打包下载失败' })
    } else {
      // 已开始流式传输，强制关闭连接
      res.destroy()
    }
  }
})

export default router
