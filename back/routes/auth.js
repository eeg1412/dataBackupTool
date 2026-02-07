const express = require('express')
const jwt = require('jsonwebtoken')
const { addLoginLog, checkIPBlocked } = require('../utils/loginLogs')
const { getClientIP } = require('../utils/ip')
const { sendTelegramMessage } = require('../utils/telegram')

const router = express.Router()

router.post('/login', async (req, res) => {
  const { username, password, remember } = req.body
  const ip = getClientIP(req, process.env.USE_CDN === 'true')

  // 检查IP是否被封禁
  const isBlocked = await checkIPBlocked(ip)
  if (isBlocked) {
    // 发送Telegram通知
    await sendTelegramMessage(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
      `<b>⚠️ 登录警告</b>\n\nIP地址 <code>${ip}</code> 在1小时内失败3次，已被临时封禁。`
    )

    return res.status(403).json({
      message: '该IP地址登录失败次数过多，已被临时封禁。请1小时后再试。'
    })
  }

  // 验证用户名密码
  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    await addLoginLog(username, ip, false)
    return res.status(401).json({ message: '用户名或密码错误' })
  }

  // 登录成功
  await addLoginLog(username, ip, true)

  // 生成JWT
  const expiresIn = remember
    ? process.env.JWT_LONG_EXPIRES_IN
    : process.env.JWT_EXPIRES_IN
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn })

  res.json({ token })
})

module.exports = router
