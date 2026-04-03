import api from './client'
import type { LoginResponse, User } from './types'

export const register = (data: { email: string; username: string; password: string }) =>
  api.post<User>('/auth/register', data)

export const login = (email: string, password: string) => {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)
  return api.post<LoginResponse>('/auth/login', formData)
}

export const getMe = () => api.get<User>('/auth/me')
