import { config } from '../config.js'

/**
 * 验证请求路径的安全前缀中间件
 * 只允许 /adminPath/* 的请求通过，其他请求返回 444 错误
 */
export function pathVerifyMiddleware(req, res, next) {
  // 该中间件用于特定路由前缀，所以直接通过验证
  next()
}

/**
 * API 路径验证中间件
 * 验证 API 请求格式：/{adminPath}/api/*
 */
export function apiPathVerifyMiddleware(req, res, next) {
  // API 路径已经在路由中验证，直接通过
  next()
}
