#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')
const os = require('os')

const isWindows = os.platform() === 'win32'
const backDir = path.join(__dirname, 'back')
const frontDir = path.join(__dirname, 'dataBackupToolFront')

console.log('🚀 启动数据备份工具开发环境...\n')

// 启动后台服务
console.log('📡 启动后台服务 (PORT: 3000)...')
const backProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: backDir,
  stdio: 'inherit',
  shell: true
})

backProcess.on('error', err => {
  console.error('❌ 后台服务启动失败:', err)
  process.exit(1)
})

// 等待后台服务启动后，再启动前端
setTimeout(() => {
  console.log('\n🎨 启动前端开发服务 (PORT: 5173)...')
  const frontProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: frontDir,
    stdio: 'inherit',
    shell: true
  })

  frontProcess.on('error', err => {
    console.error('❌ 前端服务启动失败:', err)
    process.exit(1)
  })

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n\n🛑 关闭开发环境...')
    backProcess.kill()
    frontProcess.kill()
    process.exit(0)
  })
}, 2000)

// 其他关闭方式
process.on('exit', () => {
  backProcess.kill()
})
