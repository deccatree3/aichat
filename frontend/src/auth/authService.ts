import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import type { Provider, User } from './types'

const STORAGE_KEY = 'zeta_mock_user'
const identityRequests = new Map<string, Promise<{ mid: number; uid: string }>>()

function makeMockUser(provider: Provider): User {
  return {
    id: 'u_mock_0001',
    mid: 1,
    uid: 'u_mock_0001',
    nickname: '야채',
    username: 'yachae',
    email: 'deccatree3@gmail.com',
    bio: '자기소개 하기. aichat 하나',
    birthdate: '1983.06.24',
    gender: '남성',
    provider,
    pieces: 0,
    followers: 0,
    following: 0,
  }
}

async function resolveAppIdentity(authUser: SupabaseUser) {
  if (!supabase) return { mid: 0, uid: authUser.id }
  const cached = identityRequests.get(authUser.id)
  if (cached) return cached

  const request = (async () => {
    const { data, error } = await supabase.functions.invoke<{ mid: number; uid: string }>('ensure-app-user', {
      method: 'POST',
    })
    if (error) throw error
    return {
      mid: data?.mid ?? 0,
      uid: data?.uid ?? authUser.id,
    }
  })()

  identityRequests.set(authUser.id, request)
  try {
    return await request
  } catch (error) {
    identityRequests.delete(authUser.id)
    console.warn('App user resolution skipped:', error)
    return { mid: 0, uid: authUser.id }
  }
}

async function userFromSupabase(authUser: SupabaseUser): Promise<User> {
  const metadata = authUser.user_metadata ?? {}
  const provider = (authUser.app_metadata?.provider as Provider | undefined) ?? 'google'
  const identity = await resolveAppIdentity(authUser)
  return {
    id: String(identity.mid),
    mid: identity.mid,
    uid: identity.uid,
    nickname: 'aichat 회원',
    username: `member${identity.mid || ''}`,
    email: authUser.email,
    bio: String(metadata.bio ?? '소개를 입력해보세요'),
    birthdate: String(metadata.birthdate ?? ''),
    gender: String(metadata.gender ?? ''),
    provider,
    pieces: Number(metadata.pieces ?? 0),
    followers: 0,
    following: 0,
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

interface RejoinBlockResult {
  blocked: boolean
  blockedUntil?: string
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
      if (!session?.user) {
        callback(null)
        return
      }
      void userFromSupabase(session.user).then(callback)
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

  async checkRejoinBlock(): Promise<RejoinBlockResult> {
    if (!supabase) return { blocked: false }
    try {
      const { data, error } = await supabase.functions.invoke<RejoinBlockResult>('check-rejoin-block', {
        method: 'POST',
      })
      if (error) throw error
      if (data?.blocked) await this.logout()
      return data ?? { blocked: false }
    } catch (error) {
      console.warn('Rejoin block check skipped:', error)
      return { blocked: false }
    }
  },

  async withdrawAccount(input: { reason: string; detail: string }) {
    if (!supabase) {
      saveMockUser(null)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>('withdraw-account', {
        method: 'POST',
        body: input,
      })
      if (error) throw new Error(data?.error ?? error.message)
      if (data?.ok === false) throw new Error(data.error ?? '탈퇴 처리에 실패했습니다.')
      await this.logout()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('Failed to send a request to the Edge Function')) {
        throw new Error('탈퇴 서버 기능이 아직 배포되지 않았습니다. Supabase Edge Function 배포와 비밀키 설정이 필요합니다.', { cause: error })
      }
      throw error
    }
  },

  async logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
    saveMockUser(null)
  },
}
