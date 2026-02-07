async function sendTelegramMessage(token, chatId, message) {
  if (!token || !chatId) {
    console.log('Telegram not configured, skipping notification')
    return
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })

    if (!response.ok) {
      console.error('Failed to send telegram message:', await response.text())
    }
  } catch (error) {
    console.error('Error sending telegram message:', error)
  }
}

module.exports = {
  sendTelegramMessage
}
