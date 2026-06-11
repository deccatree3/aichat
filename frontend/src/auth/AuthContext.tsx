import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { authService } from './authService'
import type { Provider, User } from './types'

export type { Provider, User } from './types'

interface AuthContextValue {
  user: User | null
  authReady: boolean
  authError: string | null
  login: (provider: Provider) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    authService.getCurrentUser()
      .then((currentUser) => {
        if (mounted) setUser(currentUser)
      })
      .catch((error: Error) => {
        if (mounted) setAuthError(error.message)
      })
      .finally(() => {
        if (mounted) setAuthReady(true)
      })

    const unsubscribe = authService.onAuthStateChange((nextUser) => {
      setUser(nextUser)
      setAuthReady(true)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const login = async (provider: Provider) => {
    setAuthError(null)
    try {
      const nextUser = await authService.login(provider)
      if (nextUser) setUser(nextUser)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '로그인에 실패했습니다.')
    }
  }

  const logout = async () => {
    setAuthError(null)
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '로그아웃에 실패했습니다.')
    }
  }

  return (
    <AuthContext.Provider value={{ user, authReady, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

