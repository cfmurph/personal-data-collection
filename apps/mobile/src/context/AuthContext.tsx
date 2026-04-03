import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { configureApiClient } from '../lib/apiClient'
import { getMe } from '../lib/apiClient'
import type { User } from '../lib/apiClient'

interface AuthContextType {
  user: User | null
  token: string | null
  setAuth: (token: string, user: User) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'pdh_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then(async (storedToken) => {
        if (storedToken) {
          setToken(storedToken)
          configureApiClient({
            getToken: () => storedToken,
            onUnauthorized: () => handleLogout(),
          })
          try {
            const res = await getMe()
            setUser(res.data)
          } catch {
            await SecureStore.deleteItemAsync(TOKEN_KEY)
            setToken(null)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  const setAuth = async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
    configureApiClient({
      getToken: () => newToken,
      onUnauthorized: handleLogout,
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout: handleLogout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
