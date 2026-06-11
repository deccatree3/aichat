import type { User } from '../auth/types'
import { supabase } from '../auth/supabase'

export type DialogueMode = 'safe' | 'unlimited'

export interface AppProfile {
  userId: string
  nickname: string
  username: string
  email: string | null
  avatarUrl: string | null
  bio: string | null
  birthdate: string | null
  gender: string | null
  provider: string | null
  onboardingCompleted: boolean
}

export interface UserSettings {
  userId: string
  dialogueMode: DialogueMode
  marketingOptIn: boolean
}

export interface WalletSummary {
  userId: string
  pieceBalance: number
}

export interface AccountData {
  profile: AppProfile
  settings: UserSettings
  wallet: WalletSummary
}

interface ProfileRow {
  user_id: string
  nickname: string
  username: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  birthdate: string | null
  gender: string | null
  provider: string | null
  onboarding_completed: boolean
}

interface SettingsRow {
  user_id: string
  dialogue_mode: DialogueMode
  marketing_opt_in: boolean
}

interface WalletRow {
  user_id: string
  piece_balance: number
}

export interface ProfilePatch {
  nickname?: string
  username?: string
  email?: string | null
  bio?: string | null
  birthdate?: string | null
  gender?: string | null
  provider?: string | null
  onboardingCompleted?: boolean
}

function fallbackProfile(user: User): AppProfile {
  const nickname = user.nickname || 'SmoothLuck3136'
  const username = user.username || nickname

  return {
    userId: user.id,
    nickname,
    username,
    email: user.email ?? null,
    avatarUrl: null,
    bio: user.bio ?? '자기소개 하기. 제타 하나',
    birthdate: user.birthdate ?? null,
    gender: user.gender ?? null,
    provider: user.provider ?? null,
    onboardingCompleted: false,
  }
}

function fallbackSettings(userId: string): UserSettings {
  return {
    userId,
    dialogueMode: 'unlimited',
    marketingOptIn: false,
  }
}

function fallbackWallet(user: User): WalletSummary {
  return {
    userId: user.id,
    pieceBalance: user.pieces ?? 0,
  }
}

function toProfile(row: ProfileRow, user: User): AppProfile {
  const fallback = fallbackProfile(user)

  return {
    userId: row.user_id,
    nickname: row.nickname || fallback.nickname,
    username: row.username || fallback.username,
    email: row.email ?? fallback.email,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? fallback.bio,
    birthdate: row.birthdate,
    gender: row.gender,
    provider: row.provider ?? fallback.provider,
    onboardingCompleted: row.onboarding_completed,
  }
}

function toSettings(row: SettingsRow): UserSettings {
  return {
    userId: row.user_id,
    dialogueMode: row.dialogue_mode,
    marketingOptIn: row.marketing_opt_in,
  }
}

function toWallet(row: WalletRow): WalletSummary {
  return {
    userId: row.user_id,
    pieceBalance: row.piece_balance,
  }
}

function profilePayload(userId: string, values: ProfilePatch) {
  return {
    user_id: userId,
    nickname: values.nickname?.trim(),
    username: values.username?.trim(),
    email: values.email ?? undefined,
    bio: values.bio ?? undefined,
    birthdate: values.birthdate ?? undefined,
    gender: values.gender ?? undefined,
    provider: values.provider ?? undefined,
    onboarding_completed: values.onboardingCompleted,
  }
}

export function formatBirthdateForDisplay(value: string | null | undefined) {
  if (!value) return ''
  return value.replaceAll('-', '.')
}

export const profileService = {
  async getAccountData(user: User): Promise<AccountData> {
    const fallback: AccountData = {
      profile: fallbackProfile(user),
      settings: fallbackSettings(user.id),
      wallet: fallbackWallet(user),
    }

    if (!supabase) return fallback

    const [profileResult, settingsResult, walletResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    if (profileResult.error || settingsResult.error || walletResult.error) return fallback

    return {
      profile: profileResult.data ? toProfile(profileResult.data as ProfileRow, user) : fallback.profile,
      settings: settingsResult.data ? toSettings(settingsResult.data as SettingsRow) : fallback.settings,
      wallet: walletResult.data ? toWallet(walletResult.data as WalletRow) : fallback.wallet,
    }
  },

  async upsertProfile(userId: string, values: ProfilePatch): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('profiles').upsert(profilePayload(userId, values), { onConflict: 'user_id' })
    if (error) throw error
  },

  async updateSettings(userId: string, values: Partial<Omit<UserSettings, 'userId'>>): Promise<void> {
    if (!supabase) return
    const payload = {
      user_id: userId,
      dialogue_mode: values.dialogueMode,
      marketing_opt_in: values.marketingOptIn,
    }
    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' })
    if (error) throw error
  },
}
