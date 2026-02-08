import crypto from 'crypto'

/**
 * 安全下载凭证缓存
 *
 * 流程：
 * 1. prepare-download 时生成 4 位随机 ID 和 16 位随机密码
 * 2. 用随机密码 AES-256-GCM 加密仓库密码 + 仓库路径 + 存档名等信息
 * 3. 将加密后的数据以 ID 为键缓存到内存，5 分钟后自动销毁
 * 4. 前端下载 URL 只携带 ID + 随机密码
 * 5. 后端用 ID 查找缓存，用随机密码解密出敏感信息，然后立即销毁该缓存条目
 */

// 内存缓存: Map<id, { encryptedData, iv, authTag, timer }>
const credentialStore = new Map()

const ID_LENGTH = 4
const PASSWORD_LENGTH = 128
const TTL_MS = 5 * 60 * 1000 // 5 分钟
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/**
 * 生成随机字符串
 */
function randomString(length, charset = CHARSET) {
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length]
  }
  return result
}

/**
 * 从 16 字符密码派生 32 字节 AES-256 密钥
 */
function deriveKey(password) {
  return crypto.createHash('sha256').update(password).digest()
}

/**
 * 加密数据
 */
function encrypt(plaintext, password) {
  const key = deriveKey(password)
  const iv = crypto.randomBytes(12) // GCM 推荐 12 字节 IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()
  return { encrypted, iv, authTag }
}

/**
 * 解密数据
 */
function decrypt(encrypted, iv, authTag, password) {
  const key = deriveKey(password)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])
  return decrypted.toString('utf8')
}

/**
 * 存储下载凭证
 * @param {Object} data - 需要加密存储的数据 { repo, archiveName, passphrase, username }
 * @returns {{ id: string, password: string }} 返回 ID 和随机密码给前端
 */
export function storeCredential(data) {
  const id = randomString(ID_LENGTH)
  const password = randomString(PASSWORD_LENGTH)

  const plaintext = JSON.stringify(data)
  const { encrypted, iv, authTag } = encrypt(plaintext, password)

  // 设置自动销毁定时器
  const timer = setTimeout(() => {
    credentialStore.delete(id)
  }, TTL_MS)

  // 防止定时器阻止进程退出
  if (timer.unref) timer.unref()

  credentialStore.set(id, { encrypted, iv, authTag, timer })

  return { id, password }
}

/**
 * 获取并销毁下载凭证（一次性使用）
 * @param {string} id - 凭证 ID
 * @param {string} password - 随机密码
 * @returns {Object|null} 解密后的数据，失败返回 null
 */
export function consumeCredential(id, password) {
  const entry = credentialStore.get(id)
  if (!entry) return null

  // 立即从缓存中删除（一次性使用）
  credentialStore.delete(id)
  clearTimeout(entry.timer)

  try {
    const plaintext = decrypt(
      entry.encrypted,
      entry.iv,
      entry.authTag,
      password
    )
    return JSON.parse(plaintext)
  } catch {
    // 密码错误或数据损坏
    return null
  }
}

/**
 * 获取当前缓存的凭证数量（用于调试）
 */
export function getCredentialCount() {
  return credentialStore.size
}
