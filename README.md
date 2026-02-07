# 数据备份工具 Data Backup Tool

基于 Vue 3 + Express 5 的数据备份管理系统，支持目录打包下载、登录认证、IP限制等功能。

## 功能特性

✨ **前端功能**

- 用户登录（支持短期/长期保持登录）
- 仪表盘统计信息展示
- 登录日志查看
- 目录选择和打包下载
- 响应式设计（Tailwind CSS）

🔒 **安全功能**

- JWT认证（默认24小时，长期1年）
- 动态安全路径前缀（防爬虫嗅探）
- IP登录失败限制（1小时内3次失败封禁）
- Telegram通知（登录失败警告）
- 路径验证（防止目录遍历攻击）

📦 **备份功能**

- 支持Borg仓库目录和普通目录
- 在线打包下载（ZIP格式）
- 流式压缩（适合大文件）

## 项目结构

```
dataBackupTool/
├── front/                    # 前端项目 (Vue 3 + Vite)
│   ├── src/
│   │   ├── api/             # API请求封装
│   │   ├── router/          # 路由配置
│   │   ├── views/           # 页面组件
│   │   │   ├── Login.vue    # 登录页
│   │   │   ├── Dashboard.vue # 仪表盘
│   │   │   └── Backup.vue   # 备份管理
│   │   ├── App.vue
│   │   └── main.js
│   ├── .env.development     # 开发环境配置
│   ├── .env.production      # 生产环境配置
│   └── package.json
│
└── back/                    # 后端项目 (Node.js + Express 5)
    ├── middleware/          # 中间件
    │   └── auth.js         # JWT认证中间件
    ├── routes/             # 路由
    │   ├── auth.js         # 登录接口
    │   ├── api.js          # 数据接口
    │   └── download.js     # 下载接口
    ├── utils/              # 工具函数
    │   ├── ip.js           # IP地址获取
    │   ├── loginLogs.js    # 登录日志管理
    │   └── telegram.js     # Telegram通知
    ├── .env                # 环境变量配置
    ├── .env.example        # 环境变量示例
    ├── server.js           # 主服务器文件
    └── package.json
```

## 安装和使用

### 1. 安装依赖

```bash
# 安装前端依赖
cd front
yarn install

# 安装后端依赖
cd ../back
yarn install

# 或使用根目录的脚本（如果配置了workspace）
yarn install:all
```

### 2. 配置环境变量

复制 `back/.env.example` 到 `back/.env`，并修改配置：

```env
# 基本配置
PORT=3000
NODE_ENV=production

# 安全路径配置（用于防爬虫）
# 例如设置为 /abc，则访问地址为 http://域名/abc
BASE_PATH=/admin

# 管理员账号密码
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# 目录配置（Windows使用双反斜杠）
BORG_DIR=D:\\backups\\borg
NORMAL_DIR=D:\\backups\\normal

# CDN配置（获取真实IP）
USE_CDN=false

# Telegram通知配置（可选）
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# JWT密钥配置（请修改为随机字符串）
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=24h
JWT_LONG_EXPIRES_IN=365d
```

**重要配置说明：**

- `BASE_PATH`: 安全路径前缀，所有请求必须以此路径开头，否则会被拒绝（类似nginx 444）
- `BORG_DIR`: Borg仓库目录的根路径
- `NORMAL_DIR`: 普通备份目录的根路径
- `USE_CDN`: 如果使用CDN或反向代理，设置为true以正确获取真实IP
- `JWT_SECRET`: 务必修改为随机字符串以保证安全

### 3. 前端环境变量配置

修改 `front/.env.development` 和 `front/.env.production`：

```env
# 必须与后端 BASE_PATH 一致
VITE_BASE_PATH=/admin

# 如果前后端分离部署，设置后端API地址
VITE_API_BASE=
```

### 4. 构建前端

```bash
cd front
yarn build
```

构建完成后，文件会自动输出到 `back/front` 目录。

### 5. 启动服务器

```bash
cd back
yarn start

# 或使用 Node.js 直接启动
node server.js
```

服务器启动后，访问：`http://localhost:3000/admin`（根据你的BASE_PATH配置）

## 开发模式

### 前端开发

```bash
cd front
yarn dev
```

前端开发服务器会运行在 `http://localhost:5173`

**注意**：开发模式下需要同时启动后端服务器，并且前端会代理API请求到后端。

### 后端开发

```bash
cd back
yarn dev
```

## API接口

### 认证接口

#### POST `/api/login`

登录接口

**请求体：**

```json
{
  "username": "admin",
  "password": "admin123",
  "remember": false
}
```

**响应：**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 数据接口（需要认证）

#### GET `/api/stats`

获取统计信息

#### GET `/api/login-logs`

获取登录日志

#### GET `/api/directories?type=borg|normal`

获取目录列表

#### GET `/api/download?type=borg|normal&path=/path/to/dir`

下载目录压缩包

## 安全特性

### 1. 路径验证

所有请求必须以配置的 `BASE_PATH` 开头，否则连接会被直接关闭（类似nginx返回444）。

### 2. JWT认证

使用JWT进行用户认证，支持短期（24小时）和长期（1年）两种有效期。

### 3. IP限制

- 记录所有登录尝试（成功和失败）
- 1小时内同一IP失败3次会被临时封禁
- 封禁时会通过Telegram发送通知（如已配置）

### 4. 登录日志

- 使用JSON文件存储登录记录
- 自动清理30天前的记录
- 记录内容：时间戳、用户名、IP地址、成功/失败状态

### 5. 目录访问控制

- 只能访问配置的 `BORG_DIR` 和 `NORMAL_DIR` 下的目录
- 防止目录遍历攻击
- 验证路径合法性

## Telegram通知配置

1. 创建Bot：与 [@BotFather](https://t.me/botfather) 对话创建机器人
2. 获取Token：创建后会得到类似 `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` 的token
3. 获取Chat ID：
   - 与你的Bot对话，发送任意消息
   - 访问 `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - 在返回的JSON中找到 `chat.id`
4. 将Token和Chat ID填入 `.env` 文件

## 注意事项

1. **Windows路径**：在 `.env` 文件中使用双反斜杠 `\\` 或正斜杠 `/`
2. **目录权限**：确保Node.js进程有读取备份目录的权限
3. **大文件下载**：目前使用内存压缩，超大目录可能导致内存占用过高
4. **生产环境**：
   - 修改默认管理员密码
   - 使用强密码和随机JWT_SECRET
   - 考虑使用HTTPS
   - 配置防火墙规则

## 技术栈

**前端：**

- Vue 3
- Vue Router
- Vite
- Axios
- Tailwind CSS 3

**后端：**

- Node.js
- Express 5
- JWT (jsonwebtoken)
- fflate (压缩库)
- dotenv

## License

MIT
