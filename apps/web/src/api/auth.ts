import api from './client'

export interface User {
  id: number
  email: string
  username: string
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const register = (data: { email: string; username: string; password: string }) =>
  api.post<User>('/auth/register', data)

export const login = (email: string, password: string) => {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)
  return api.post<LoginResponse>('/auth/login', formData)
}

export const getMe = () => api.get<User>('/auth/me')
