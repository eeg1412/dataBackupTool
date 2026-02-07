import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Login from '../views/Login.vue'

// 安全路径前缀（与后端 ADMIN_PATH 保持一致）
// 可以从环境变量或配置文件读取
const ADMIN_PATH = 'abc'

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About }
]

const router = createRouter({
  history: createWebHistory(`/${ADMIN_PATH}/`),
  routes
})

export default router
export { ADMIN_PATH }
