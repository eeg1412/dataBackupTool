import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { config } from '../config.js'

const PRIVATE_KEY_FILE = path.join(config.dataDir, 'jwt_private.pem')
const PUBLIC_KEY_FILE = path.join(config.dataDir, 'jwt_public.pem')

let privateKey = null
let publicKey = null

/**
 * 初始化 JWT RSA 密钥对
 * 如果密钥文件不存在，则自动生成 RSA 2048 密钥对
 */
export async function initJWTKeys() {
  // 确保 data 目录存在
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true })
  }

  if (fs.existsSync(PRIVATE_KEY_FILE) && fs.existsSync(PUBLIC_KEY_FILE)) {
    privateKey = fs.readFileSync(PRIVATE_KEY_FILE, 'utf-8')
    publicKey = fs.readFileSync(PUBLIC_KEY_FILE, 'utf-8')
    console.log('[JWT] 已加载现有 RSA 密钥对')
  } else {
    console.log('[JWT] 未找到 RSA 密钥对，正在生成...')
    const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync(
      'rsa',
      {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      }
    )

    privateKey = priv
    publicKey = pub

    // 写入文件时限制权限（仅文件所有者可读写）
    fs.writeFileSync(PRIVATE_KEY_FILE, priv, { mode: 0o600 })
    fs.writeFileSync(PUBLIC_KEY_FILE, pub, { mode: 0o644 })

    console.log('[JWT] RSA 密钥对已生成并保存到 data/ 目录')
  }
}

export function getPrivateKey() {
  if (!privateKey) {
    throw new Error('JWT 密钥未初始化，请先调用 initJWTKeys()')
  }
  return privateKey
}

export function getPublicKey() {
  if (!publicKey) {
    throw new Error('JWT 密钥未初始化，请先调用 initJWTKeys()')
  }
  return publicKey
}
