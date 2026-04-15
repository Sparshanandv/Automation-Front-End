import api from '../utils/axios'
import { token } from '../utils/token'

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: { id: string; email: string }
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/signup', { email, password })
  token.set(data.access_token, data.refresh_token, data.user.email)
  return data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  token.set(data.access_token, data.refresh_token, data.user.email)
  return data
}

export function logout() {
  token.clear()
}
