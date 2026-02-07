import https from 'https'
import { config } from '../config.js'

/**
 * 通过 Telegram API 发送消息
 * @param {string} message - 要发送的消息内容
 * @returns {Promise<boolean>} 发送是否成功
 */
export async function sendTelegramMessage(message) {
  if (!config.telegramBotToken || !config.telegramChatId) {
    console.warn('⚠️  Telegram not configured, skipping notification')
    return false
  }

  return new Promise(resolve => {
    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`

    const data = JSON.stringify({
      chat_id: config.telegramChatId,
      text: message,
      parse_mode: 'HTML'
    })

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }

    const req = https.request(url, options, res => {
      let responseData = ''

      res.on('data', chunk => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData)
          if (result.ok) {
            console.log('✅ Telegram message sent successfully')
            resolve(true)
          } else {
            console.error('❌ Telegram API error:', result.description)
            resolve(false)
          }
        } catch (err) {
          console.error('Error parsing Telegram response:', err)
          resolve(false)
        }
      })
    })

    req.on('error', err => {
      console.error('Telegram request error:', err)
      resolve(false)
    })

    req.write(data)
    req.end()
  })
}

/**
 * 发送登录失败通知
 * @param {string} ip - 客户端 IP
 * @param {number} failCount - 失败次数
 */
export async function notifyLoginFailure(ip, failCount) {
  const message =
    `🚨 <b>登录失败告警</b>\n\n` +
    `IP: <code>${ip}</code>\n` +
    `失败次数: ${failCount}\n` +
    `时间: ${new Date().toLocaleString('zh-CN')}`

  return sendTelegramMessage(message)
}

/**
 * 发送 IP 被禁止通知
 * @param {string} ip - 被禁止的 IP
 */
export async function notifyIPBlocked(ip) {
  const message =
    `🔒 <b>IP 已被禁止登录</b>\n\n` +
    `IP: <code>${ip}</code>\n` +
    `原因: 1 小时内登录失败次数过多\n` +
    `时间: ${new Date().toLocaleString('zh-CN')}`

  return sendTelegramMessage(message)
}
