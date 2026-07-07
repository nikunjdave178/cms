import { createContext, useContext, useEffect, useState } from 'react'
import { login as loginApi } from '../api/auth'
import { AUTH_STORAGE_KEY } from '../api/client'

const AuthContext = createContext(null)

function readStorage() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return { token: null, user: null }
  try {
    return JSON.parse(raw)
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStorage)

  useEffect(() => {
    const onUnauthorized = () => setAuth({ token: null, user: null })
    window.addEventListener('cms:unauthorized', onUnauthorized)
    return () => window.removeEventListener('cms:unauthorized', onUnauthorized)
  }, [])

  const login = async (email, password) => {
    const { token, user } = await loginApi(email, password)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }))
    setAuth({ token, user })
  }

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuth({ token: null, user: null })
  }

  const hasRole = (...roles) => !!auth.user && roles.includes(auth.user.role)

  return (
    <AuthContext.Provider value={{ user: auth.user, token: auth.token, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
