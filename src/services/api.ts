import axios, { AxiosError } from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { refreshAccessToken } from './authService'

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

interface QueuedRequest {
  resolve: () => void
  reject: (error: unknown) => void
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: QueuedRequest[] = []

function processQueue(error: unknown): void {
  const queue = failedQueue
  failedQueue = []
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve()
  })
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined

    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => {
          original._retry = true
          return api(original)
        })
        .catch((e: unknown) => Promise.reject(e))
    }

    original._retry = true
    isRefreshing = true

    try {
      await refreshAccessToken()
      processQueue(null)
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError)
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
