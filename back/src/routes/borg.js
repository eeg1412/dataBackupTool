import { Router } from 'express'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
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

const execFileAsync = promisify(execFile)
const router = Router()

/**
 * 验证仓库路径是否在配置列表中
 */
function isRepoAllowed(repo) {
  if (!repo || typeof repo !== 'string') return false
  const resolved = path.resolve(repo)
  return config.borgRepos.some(r => path.resolve(r) === resolved)
}

/**
 * 获取规范化后的仓库路径（确保执行路径与校验路径一致）
 */
function getResolvedRepo(repo) {
  return path.resolve(repo)
}

/**
 * 验证存档名称是否合法（防止命令注入）
 */
function isValidArchiveName(name) {
  if (!name || typeof name !== 'string') return false
  if (name.length > 250) return false
  return /^[a-zA-Z0-9._\-:]+$/.test(name)
}

/**
 * 获取 Borg 仓库列表
 */
router.get('/repos', authMiddleware, async (_req, res) => {
  // Borg 仅在 Linux 上可用
  if (process.platform !== 'linux') {
    return res.json({
      available: false,
      message: 'Borg 备份功能仅在 Linux 系统上可用'
    })
  }

  // 检查 borg 是否安装
  try {
    await execFileAsync('borg', ['--version'], { timeout: 5000 })
  } catch {
    return res.json({
      available: false,
      message: 'Borg 备份工具未安装或不在 PATH 中'
    })
  }

  if (config.borgRepos.length === 0) {
    return res.json({
      available: true,
      repos: []
    })
  }

  const repos = config.borgRepos.map(repo => ({
    path: repo,
    name: path.basename(repo)
  }))

  res.json({ available: true, repos })
})

/**
 * 列出指定仓库的存档（使用 POST 以安全传递密码）
 */
router.post('/archives', authMiddleware, async (req, res) => {
  const { repo, passphrase } = req.body || {}

  if (process.platform !== 'linux') {
    return res.status(400).json({ error: 'Borg 仅在 Linux 上可用' })
  }

  if (!isRepoAllowed(repo)) {
    return res.status(403).json({ error: '无权访问此仓库' })
  }

  const resolvedRepo = getResolvedRepo(repo)

  const borgEnv = { ...process.env }
  if (passphrase && typeof passphrase === 'string') {
    borgEnv.BORG_PASSPHRASE = passphrase
  } else {
    borgEnv.BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK = 'yes'
  }

  try {
    const { stdout } = await execFileAsync(
      'borg',
      ['list', '--json', resolvedRepo],
      {
        timeout: 30000,
        env: borgEnv
      }
    )

    const data = JSON.parse(stdout)
    const archives = (data.archives || []).map(a => ({
      name: a.name,
      start: a.start,
      id: a.id
    }))

    // 按时间倒序排列
    archives.sort(
      (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
    )

    // Telegram 通知
    const ip = getClientIP(req)
    sendTelegramMessage(
      `📂 <b>查看 Borg 存档</b>\n仓库: <code>${escapeHTML(path.basename(resolvedRepo))}</code>\n存档数: ${archives.length}\nIP: <code>${escapeHTML(ip)}</code>\n时间: ${new Date().toLocaleString('zh-CN')}`
    ).catch(() => {})

    res.json({ archives })
  } catch (err) {
    console.error('[Borg] 列出存档失败:', err.message)
    // 检查是否密码错误
    if (
      err.stderr &&
      (err.stderr.includes('passphrase') || err.stderr.includes('Wrong'))
    ) {
      return res.status(403).json({ error: '仓库密码错误或需要密码' })
    }
    res.status(500).json({ error: '获取存档列表失败' })
  }
})

/**
 * 流式导出并下载存档（使用 borg export-tar，不占用磁盘空间）
 */
router.get('/download', downloadAuthMiddleware, (req, res) => {
  const repo = req.query.repo
  const archive = req.query.archive
  const passphrase = req.query.passphrase || ''

  if (process.platform !== 'linux') {
    return res.status(400).json({ error: 'Borg 仅在 Linux 上可用' })
  }

  if (!isRepoAllowed(repo)) {
    return res.status(403).json({ error: '无权访问此仓库' })
  }

  if (!isValidArchiveName(archive)) {
    return res.status(400).json({ error: '无效的存档名称' })
  }

  const resolvedRepo = getResolvedRepo(repo)

  const safeArchiveName = archive.replace(/[^a-zA-Z0-9._\-]/g, '_')

  res.setHeader('Content-Type', 'application/gzip')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(safeArchiveName)}.tar.gz"; filename*=UTF-8''${encodeURIComponent(safeArchiveName)}.tar.gz`
  )
  res.setHeader('Transfer-Encoding', 'chunked')

  const borgEnv = { ...process.env }
  if (passphrase) {
    borgEnv.BORG_PASSPHRASE = passphrase
  } else {
    borgEnv.BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK = 'yes'
  }

  const child = spawn(
    'borg',
    ['export-tar', '--tar-filter=gzip', `${resolvedRepo}::${archive}`, '-'],
    {
      env: borgEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  // Telegram 通知
  const ip = getClientIP(req)
  sendTelegramMessage(
    `⬇️ <b>下载 Borg 存档</b>\n仓库: <code>${escapeHTML(path.basename(resolvedRepo))}</code>\n存档: <code>${escapeHTML(archive)}</code>\nIP: <code>${escapeHTML(ip)}</code>\n时间: ${new Date().toLocaleString('zh-CN')}`
  ).catch(() => {})

  child.stdout.pipe(res)

  child.stderr.on('data', data => {
    console.error(`[Borg] stderr: ${data.toString()}`)
  })

  child.on('error', err => {
    console.error('[Borg] 子进程错误:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: '导出存档失败' })
    }
  })

  child.on('close', code => {
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: '导出存档失败' })
    }
  })

  // 客户端断开时终止子进程
  req.on('close', () => {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  })
})

export default router
