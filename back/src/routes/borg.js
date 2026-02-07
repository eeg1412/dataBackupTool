import { Router } from 'express'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { config } from '../config.js'
import {
  authMiddleware,
  generateBorgDownloadToken,
  verifyToken
} from '../middleware/auth.js'
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
  // 始终设置 BORG_PASSPHRASE 以防止 borg 交互式提示密码导致进程挂起
  borgEnv.BORG_PASSPHRASE =
    passphrase && typeof passphrase === 'string' ? passphrase : ''
  borgEnv.BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK = 'yes'
  // Docker 中挂载已有仓库时，borg 会提示 relocated repository 确认
  borgEnv.BORG_RELOCATED_REPO_ACCESS_IS_OK = 'yes'

  try {
    const { stdout, stderr } = await execFileAsync(
      'borg',
      ['list', '--json', '--bypass-lock', resolvedRepo],
      {
        timeout: 30000,
        env: borgEnv
      }
    )
    if (stderr) {
      console.log('[Borg] list stderr:', stderr)
    }

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
    const stderr = err.stderr || err.message || ''
    // 检查是否密码错误
    if (
      stderr.includes('passphrase') ||
      stderr.includes('Wrong') ||
      stderr.includes('PassphraseWrong') ||
      (stderr.includes('key') && stderr.includes('Enter'))
    ) {
      return res.status(403).json({ error: '仓库密码错误或需要密码' })
    }
    res.status(500).json({ error: '获取存档列表失败' })
  }
})

/**
 * 准备下载：校验参数，将 repo + archiveName + passphrase 编码进短效 JWT
 * 前端先 POST 此接口拿到 token，再用 GET /download?token=xxx 下载
 * 这样 URL 中不会暴露密码和存档名
 */
router.post('/prepare-download', authMiddleware, async (req, res) => {
  const { repo, archiveIndex, passphrase } = req.body || {}

  if (process.platform !== 'linux') {
    return res.status(400).json({ error: 'Borg 仅在 Linux 上可用' })
  }

  if (!isRepoAllowed(repo)) {
    return res.status(403).json({ error: '无权访问此仓库' })
  }

  if (typeof archiveIndex !== 'number' || archiveIndex < 0) {
    return res.status(400).json({ error: '无效的存档序号' })
  }

  const resolvedRepo = getResolvedRepo(repo)

  // 先列出存档以验证序号并获取真实存档名
  const borgEnv = { ...process.env }
  borgEnv.BORG_PASSPHRASE =
    passphrase && typeof passphrase === 'string' ? passphrase : ''
  borgEnv.BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK = 'yes'
  borgEnv.BORG_RELOCATED_REPO_ACCESS_IS_OK = 'yes'

  try {
    const { stdout, stderr } = await execFileAsync(
      'borg',
      ['list', '--json', '--bypass-lock', resolvedRepo],
      { timeout: 30000, env: borgEnv }
    )
    if (stderr) {
      console.log('[Borg] prepare-download list stderr:', stderr)
    }

    const data = JSON.parse(stdout)
    const archives = (data.archives || []).map(a => ({
      name: a.name,
      start: a.start
    }))

    // 按时间倒序排列（与前端显示一致）
    archives.sort(
      (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
    )

    if (archiveIndex >= archives.length) {
      return res.status(400).json({ error: '存档序号超出范围' })
    }

    const archiveName = archives[archiveIndex].name

    // 将信息编码进短效 JWT
    const token = generateBorgDownloadToken({
      username: req.user.username,
      repo: resolvedRepo,
      archiveName,
      passphrase: passphrase || ''
    })

    res.json({ token, archiveName })
  } catch (err) {
    console.error('[Borg] prepare-download 失败:', err.message)
    if (err.stderr) {
      console.error('[Borg] prepare-download stderr:', err.stderr)
    }
    res.status(500).json({ error: '准备下载失败' })
  }
})

/**
 * 流式导出并下载存档（使用 borg export-tar，不占用磁盘空间）
 * token 中已包含所有所需信息（repo、archiveName、passphrase），URL 不再暴露敏感数据
 */
router.get('/download', (req, res) => {
  const tokenStr = req.query.token
  if (!tokenStr) {
    return res.status(401).json({ error: '需要下载凭证' })
  }

  const payload = verifyToken(tokenStr)
  if (!payload || payload.purpose !== 'borg-download') {
    return res.status(401).json({ error: '下载凭证无效或已过期' })
  }

  const { repo: resolvedRepo, archiveName: archive, passphrase } = payload

  if (process.platform !== 'linux') {
    return res.status(400).json({ error: 'Borg 仅在 Linux 上可用' })
  }

  if (!isRepoAllowed(resolvedRepo)) {
    return res.status(403).json({ error: '无权访问此仓库' })
  }

  const safeArchiveName = archive.replace(/[^a-zA-Z0-9._\-]/g, '_')

  const borgEnv = { ...process.env }
  // 始终设置 BORG_PASSPHRASE 以防止交互式提示
  borgEnv.BORG_PASSPHRASE = passphrase || ''
  borgEnv.BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK = 'yes'
  borgEnv.BORG_RELOCATED_REPO_ACCESS_IS_OK = 'yes'

  console.log(`[Borg] 开始导出: repo=${resolvedRepo}, archive=${archive}`)

  const child = spawn(
    'borg',
    [
      'export-tar',
      '--bypass-lock',
      '--tar-filter=gzip',
      `${resolvedRepo}::${archive}`,
      '-'
    ],
    {
      env: borgEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  let stderrChunks = []
  let headersSent = false

  child.stderr.on('data', data => {
    const msg = data.toString()
    stderrChunks.push(msg)
    console.error(`[Borg] export-tar stderr: ${msg}`)
  })

  // 等待第一块 stdout 数据再发送响应头，确保 borg 正常启动
  child.stdout.once('data', firstChunk => {
    headersSent = true
    res.setHeader('Content-Type', 'application/gzip')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(safeArchiveName)}.tar.gz"; filename*=UTF-8''${encodeURIComponent(safeArchiveName)}.tar.gz`
    )
    res.setHeader('Transfer-Encoding', 'chunked')
    res.write(firstChunk)
    child.stdout.pipe(res)
  })

  // Telegram 通知
  const ip = getClientIP(req)
  sendTelegramMessage(
    `⬇️ <b>下载 Borg 存档</b>\n仓库: <code>${escapeHTML(path.basename(resolvedRepo))}</code>\n存档: <code>${escapeHTML(archive)}</code>\nIP: <code>${escapeHTML(ip)}</code>\n时间: ${new Date().toLocaleString('zh-CN')}`
  ).catch(() => {})

  child.on('error', err => {
    console.error('[Borg] 子进程错误:', err.message)
    if (!headersSent) {
      res.status(500).json({ error: '导出存档失败: ' + err.message })
    }
  })

  child.on('close', code => {
    const allStderr = stderrChunks.join('')
    console.log(
      `[Borg] export-tar 进程退出, code=${code}, stderr=${allStderr || '(empty)'}`
    )
    if (code !== 0) {
      if (!headersSent) {
        const errMsg =
          allStderr.includes('passphrase') || allStderr.includes('Wrong')
            ? '仓库密码错误'
            : `导出存档失败 (exit code ${code}): ${allStderr.slice(0, 200)}`
        res.status(500).json({ error: errMsg })
      } else {
        // 响应头已发送，只能中断连接
        res.end()
      }
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
