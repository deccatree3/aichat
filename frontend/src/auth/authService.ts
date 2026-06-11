import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import type { Provider, User } from './types'

const STORAGE_KEY = 'zeta_mock_user'

function makeMockUser(provider: Provider): User {
  return {
    id: 'u_mock_0001',
    nickname: '야채',
    username: 'yachae',
    email: 'deccatree3@gmail.com',
    bio: '자기소개 하기. 제타 하나',
    birthdate: '1983.06.24',
    gender: '남성',
    provider,
    pieces: 170,
    followers: 0,
    following: 0,
    zetaPass: false,
    zetaPassDaysRemaining: 27,
  }
}

function userFromSupabase(authUser: SupabaseUser): User {
  const metadata = authUser.user_metadata ?? {}
  const provider = (authUser.app_metadata?.provider as Provider | undefined) ?? 'google'
  return {
    id: authUser.id,
    nickname: String(metadata.name ?? metadata.full_name ?? metadata.nickname ?? 'zeta'),
    username: String(metadata.preferred_username ?? metadata.user_name ?? authUser.email?.split('@')[0] ?? 'user'),
    email: authUser.email,
    bio: String(metadata.bio ?? '자기소개 하기. 제타 하나'),
    birthdate: String(metadata.birthdate ?? '1983.06.24'),
    gender: String(metadata.gender ?? '남성'),
    provider,
    pieces: Number(metadata.pieces ?? 170),
    followers: 0,
    following: 0,
    zetaPass: false,
    zetaPassDaysRemaining: 27,
  }
}

function readMockUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function saveMockUser(user: User | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  else localStorage.removeItem(STORAGE_KEY)
}

export const authService = {
  isConfigured: isSupabaseConfigured,

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return readMockUser()
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session?.user ? userFromSupabase(data.session.user) : null
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    if (!supabase) return () => {}
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? userFromSupabase(session.user) : null)
    })
    return () => data.subscription.unsubscribe()
  },

  async login(provider: Provider) {
    if (!supabase) {
      const user = makeMockUser(provider)
      saveMockUser(user)
      return user
    }

    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: provider === 'kakao' ? 'account_email' : undefined,
      },
    })
    if (error) throw error
    return null
  },

  async completeCallback() {
    if (!supabase) return null
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) return null
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    return data.session?.user ? userFromSupabase(data.session.user) : null
  },

  async logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
    saveMockUser(null)
  },
}
