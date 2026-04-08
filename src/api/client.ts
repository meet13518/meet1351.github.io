import axios from 'axios'

/** 预留：后续将 API 实现切换为真实后端时统一走此实例 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 30_000,
})
