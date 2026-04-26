import axios from 'axios';
import { refreshAccessToken } from './authService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  const queue = failedQueue;
  failedQueue = [];
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        original._retry = true;
        return api(original);
      }).catch((e) => Promise.reject(e));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await refreshAccessToken();
      processQueue(null);
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
