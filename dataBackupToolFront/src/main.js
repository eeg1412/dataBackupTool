import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import * as api from './api/index.js'

const app = createApp(App)

// 注册 API 为全局属性
app.config.globalProperties.$api = api

// 或者使用 Provide 供子组件使用
app.provide('$api', api)

app.use(router).mount('#app')
