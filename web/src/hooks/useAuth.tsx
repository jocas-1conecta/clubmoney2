import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase/client'
import type { UserProfile, UserRole } from '@/types'

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  roles: UserRole[]
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    roles: [],
    isLoading: true,
  })

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('usuario_roles')
          .select('id, usuario_id, rol_id, roles(nombre)')
          .eq('usuario_id', userId),
      ])

      if (profileResult.error) {
        console.warn('[Auth] Profile fetch error:', profileResult.error.message)
      }
      if (rolesResult.error) {
        console.warn('[Auth] Roles fetch error:', rolesResult.error.message)
      }

      const profile = profileResult.data as UserProfile | null

      const roles = (rolesResult.data ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => {
          const rol = Array.isArray(r.roles) ? r.roles[0] : r.roles
          return rol?.nombre as UserRole
        }
      ).filter(Boolean)

      return { profile, roles }
    } catch (err) {
      console.error('[Auth] fetchProfile failed:', err)
      return { profile: null, roles: [] as UserRole[] }
    }
  }, [])

  useEffect(() => {
    // Get initial session with timeout to prevent hanging on orphaned locks
    const sessionTimeout = new Promise<{ data: { session: null } }>(
      (resolve) => setTimeout(() => {
        console.warn('[Auth] getSession timed out — clearing stale auth state')
        resolve({ data: { session: null } })
      }, 5000)
    )

    Promise.race([
      supabase.auth.getSession(),
      sessionTimeout,
    ]).then(async ({ data: { session } }) => {
      if (session?.user) {
        const { profile, roles } = await fetchProfile(session.user.id)
        setState({
          session,
          user: session.user,
          profile,
          roles,
          isLoading: false,
        })
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }).catch((err) => {
      console.error('[Auth] getSession failed:', err)
      setState(prev => ({ ...prev, isLoading: false }))
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { profile, roles } = await fetchProfile(session.user.id)
        setState({
          session,
          user: session.user,
          profile,
          roles,
          isLoading: false,
        })
      } else if (event === 'SIGNED_OUT') {
        setState({
          session: null,
          user: null,
          profile: null,
          roles: [],
          isLoading: false,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const hasRole = useCallback(
    (role: UserRole) => state.roles.includes(role),
    [state.roles]
  )

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
