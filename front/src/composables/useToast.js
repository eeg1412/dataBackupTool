import { ref } from 'vue'

const toasts = ref([])
let idCounter = 0

export function useToast() {
  /**
   * 显示toast通知
   * @param {string} message - 消息内容
   * @param {string} type - 类型: success, error, info, warning
   * @param {number} duration - 显示时长（毫秒）
   */
  function showToast(message, type = 'info', duration = 3000) {
    const id = ++idCounter
    const toast = {
      id,
      message,
      type,
      visible: true
    }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function removeToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // 便捷方法
  function success(message, duration = 3000) {
    return showToast(message, 'success', duration)
  }

  function error(message, duration = 5000) {
    return showToast(message, 'error', duration)
  }

  function info(message, duration = 3000) {
    return showToast(message, 'info', duration)
  }

  function warning(message, duration = 4000) {
    return showToast(message, 'warning', duration)
  }

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning
  }
}
