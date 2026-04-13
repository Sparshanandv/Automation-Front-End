import axios from 'axios'
import { token } from './token'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: `${BASE}/api`,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const accessToken = token.getAccess()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// On 401, try refresh once then redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = token.getRefresh()

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${BASE}/api/auth/refresh`,
            { refresh_token: refreshToken }
          )
          token.set(data.access_token, refreshToken)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          token.clear()
        }
      }

      token.clear()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
