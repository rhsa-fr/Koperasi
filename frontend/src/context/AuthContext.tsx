'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { AuthUser, AuthState, LoginRequest, UserRole } from '@/types/auth'
import { authService } from '@/lib/auth'
import { tokenStorage, isTokenValid } from '@/lib/token'

// ============================================================================
// Context Types
// ============================================================================

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
  can: (resource: string, action: string) => boolean
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // On mount — restore session and sync with server
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getToken()
      if (isTokenValid(token)) {
        try {
          // Sync with server to get latest permissions
          // Method is named 'me', not 'getMe'
          const data = await authService.me()
          const user: AuthUser = {
            id: data.id_user,
            username: data.username,
            role: data.role,
            permissions: data.permissions
          }
          tokenStorage.setUser(user) // Update sync storage
          setState({ user, token: token!, isAuthenticated: true, isLoading: false })
        } catch (error) {
          console.error('Session sync failed:', error)
          // Fallback to local user if sync fails but token is still potentially valid
          const localUser = tokenStorage.getUser()
          if (localUser) {
            setState({ user: localUser, token: token!, isAuthenticated: true, isLoading: false })
          } else {
            tokenStorage.clear()
            setState((prev) => ({ ...prev, user: null, token: null, isAuthenticated: false, isLoading: false }))
          }
        }
      } else {
        tokenStorage.clear()
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    initAuth()
  }, [])

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginRequest) => {
    const user = await authService.login(credentials)
    const token = tokenStorage.getToken()!

    setState({ user, token, isAuthenticated: true, isLoading: false })
    router.push('/dashboard')
  }, [router])

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    await authService.logout()
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
    router.push('/login')
  }, [router])

  // ── role check ────────────────────────────────────────────────────────────
  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!state.user) return false
      return roles.includes(state.user.role)
    },
    [state.user]
  )

  // ── permission check ──────────────────────────────────────────────────────
  const can = useCallback(
    (resource: string, action: string) => {
      if (!state.user) return false
      
      // ── Super Admin PROTECTED Role (Permanent Bypass) ──
      if (state.user.role === 'super_admin') return true

      // Check dynamic permissions
      const perms = state.user.permissions?.[resource]
      return perms ? perms.includes(action) : false
    },
    [state.user]
  )

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, hasRole, can }),
    [state, login, logout, hasRole, can]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Hooks
// ============================================================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function useUser(): AuthUser {
  const { user } = useAuth()
  if (!user) throw new Error('No authenticated user')
  return user
}
