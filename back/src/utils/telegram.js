import { config } from '../config.js'

export async function sendTelegramMessage(message) {
  if (!config.telegramToken || !config.telegramChatId) {
    console.warn('[Telegram] 未设置 token 或 chatId，跳过通知')
    return null
  }

  const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text: message,
        parse_mode: 'HTML'
      }),
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error(`[Telegram] 发送失败: ${response.status} ${errBody}`)
      return null
    }

    return await response.json()
  } catch (err) {
    console.error(`[Telegram] 发送异常: ${err.message}`)
    return null
  }
}
