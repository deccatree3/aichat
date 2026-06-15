import type { User } from '../auth/types'
import { supabase } from '../auth/supabase'

export type DialogueMode = 'safe' | 'unlimited'

export interface AppProfile {
  userId: string
  nickname: string
  username: string
  avatarUrl: string | null
  bio: string | null
  birthdate: string | null
  gender: string | null
  onboardingCompleted: boolean
}

export interface UserSettings {
  userId: string
  dialogueMode: DialogueMode
  marketingOptIn: boolean
  chatBackgroundEnabled: boolean
}

export interface WalletSummary {
  userId: string
  pieceBalance: number
}

export interface SocialIdentitySummary {
  provider: string
  email: string | null
  providerName: string | null
  providerAvatarUrl: string | null
}

export interface FollowSummary {
  followers: number
  following: number
}

export interface MembershipSummary {
  active: boolean
  planCode: string | null
  daysRemaining: number | null
}

export interface AutoChargeSummary {
  enabled: boolean
  thresholdPieces: number
}

export interface AccountData {
  profile: AppProfile
  settings: UserSettings
  wallet: WalletSummary
  identity: SocialIdentitySummary
  follows: FollowSummary
  membership: MembershipSummary
  autoCharge: AutoChargeSummary
}

interface ProfileRow {
  mid: string
  nickname: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  birthdate: string | null
  gender: string | null
  onboarding_completed: boolean
}

interface SettingsRow {
  mid: string
  dialogue_mode: DialogueMode
  marketing_opt_in: boolean
  chat_background_enabled?: boolean
}

interface WalletRow {
  mid: string
  piece_balance: number
}

interface IdentityRow {
  provider: string
  email: string | null
  provider_name: string | null
  provider_avatar_url: string | null
}

interface MembershipRow {
  plan_code: string
  ends_at: string | null
}

interface AutoChargeRow {
  enabled: boolean
  threshold_pieces: number
}

export interface ProfilePatch {
  nickname?: string
  username?: string
  bio?: string | null
  birthdate?: string | null
  gender?: string | null
  onboardingCompleted?: boolean
}

function generatedSocialName(user: User) {
  const suffix = user.mid || Number(user.id) || ''
  return `aichat${suffix}`
}

function fallbackProfile(user: User): AppProfile {
  const nickname = user.nickname && user.nickname !== 'aichat 회원'
    ? user.nickname
    : generatedSocialName(user)
  const username = user.username || nickname

  return {
    userId: user.id,
    nickname,
    username,
    avatarUrl: null,
    bio: user.bio ?? '자기소개 하기. aichat 하나',
    birthdate: user.birthdate ?? null,
    gender: user.gender ?? null,
    onboardingCompleted: false,
  }
}

function fallbackSettings(userId: string): UserSettings {
  return {
    userId,
    dialogueMode: 'unlimited',
    marketingOptIn: false,
    chatBackgroundEnabled: false,
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
    userId: row.mid,
    nickname: row.nickname || fallback.nickname,
    username: row.username || fallback.username,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? fallback.bio,
    birthdate: row.birthdate,
    gender: row.gender,
    onboardingCompleted: row.onboarding_completed,
  }
}

function toSettings(row: SettingsRow): UserSettings {
  return {
    userId: row.mid,
    dialogueMode: row.dialogue_mode,
    marketingOptIn: row.marketing_opt_in,
    chatBackgroundEnabled: Boolean(row.chat_background_enabled),
  }
}

function toWallet(row: WalletRow): WalletSummary {
  return {
    userId: row.mid,
    pieceBalance: row.piece_balance,
  }
}

function fallbackIdentity(user: User): SocialIdentitySummary {
  return {
    provider: user.provider,
    email: user.email ?? null,
    providerName: null,
    providerAvatarUrl: null,
  }
}

function toIdentity(row: IdentityRow): SocialIdentitySummary {
  return {
    provider: row.provider,
    email: row.email,
    providerName: row.provider_name,
    providerAvatarUrl: row.provider_avatar_url,
  }
}

function toMembership(row: MembershipRow | null): MembershipSummary {
  if (!row) return { active: false, planCode: null, daysRemaining: null }
  const daysRemaining = row.ends_at
    ? Math.max(0, Math.ceil((new Date(row.ends_at).getTime() - Date.now()) / 86400000))
    : null

  return {
    active: true,
    planCode: row.plan_code,
    daysRemaining,
  }
}

function toAutoCharge(row: AutoChargeRow | null): AutoChargeSummary {
  return {
    enabled: Boolean(row?.enabled),
    thresholdPieces: Number(row?.threshold_pieces ?? 0),
  }
}

function profilePayload(userId: string, values: ProfilePatch) {
  return {
    mid: userId,
    nickname: values.nickname?.trim(),
    username: values.username?.trim(),
    bio: values.bio ?? undefined,
    birthdate: values.birthdate ?? undefined,
    gender: values.gender ?? undefined,
    onboarding_completed: values.onboardingCompleted,
  }
}

function socialProfilePayload(user: User, values: ProfilePatch = {}) {
  const nickname = values.nickname?.trim() || generatedSocialName(user)
  const username = values.username?.trim() || nickname

  return profilePayload(user.id, {
    ...values,
    nickname,
    username,
  })
}

function settingsPayload(userId: string, values: Partial<Omit<UserSettings, 'userId'>>) {
  return {
    mid: userId,
    dialogue_mode: values.dialogueMode,
    marketing_opt_in: values.marketingOptIn,
    chat_background_enabled: values.chatBackgroundEnabled,
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
      identity: fallbackIdentity(user),
      follows: { followers: user.followers ?? 0, following: user.following ?? 0 },
      membership: { active: false, planCode: null, daysRemaining: null },
      autoCharge: { enabled: false, thresholdPieces: 0 },
    }

    if (!supabase) return fallback

    const [
      profileResult,
      settingsResult,
      walletResult,
      identityResult,
      followersResult,
      followingResult,
      membershipResult,
      autoChargeResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('mid', user.id).maybeSingle(),
      supabase.from('user_settings').select('*').eq('mid', user.id).maybeSingle(),
      supabase.from('wallets').select('*').eq('mid', user.id).maybeSingle(),
      supabase
        .from('auth_identities')
        .select('provider,email,provider_name,provider_avatar_url')
        .eq('mid', user.id)
        .is('unlinked_at', null)
        .order('linked_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('follows').select('following_mid', { count: 'exact', head: true }).eq('following_mid', user.id),
      supabase.from('follows').select('follower_mid', { count: 'exact', head: true }).eq('follower_mid', user.id),
      supabase
        .from('memberships')
        .select('plan_code,ends_at')
        .eq('mid', user.id)
        .eq('status', 'active')
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .order('ends_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('auto_charge_settings').select('enabled,threshold_pieces').eq('mid', user.id).maybeSingle(),
    ])

    if (profileResult.error || settingsResult.error || walletResult.error) return fallback

    return {
      profile: profileResult.data ? toProfile(profileResult.data as ProfileRow, user) : fallback.profile,
      settings: settingsResult.data ? toSettings(settingsResult.data as SettingsRow) : fallback.settings,
      wallet: walletResult.data ? toWallet(walletResult.data as WalletRow) : fallback.wallet,
      identity: identityResult.error || !identityResult.data ? fallback.identity : toIdentity(identityResult.data as IdentityRow),
      follows: {
        followers: followersResult.error ? fallback.follows.followers : followersResult.count ?? 0,
        following: followingResult.error ? fallback.follows.following : followingResult.count ?? 0,
      },
      membership: membershipResult.error ? fallback.membership : toMembership((membershipResult.data as MembershipRow | null) ?? null),
      autoCharge: autoChargeResult.error ? fallback.autoCharge : toAutoCharge((autoChargeResult.data as AutoChargeRow | null) ?? null),
    }
  },

  async upsertProfile(userId: string, values: ProfilePatch): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('profiles').upsert(profilePayload(userId, values), { onConflict: 'mid' })
    if (error) throw error
  },

  async ensureSocialProfile(user: User, values: ProfilePatch = {}): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('profiles').upsert(socialProfilePayload(user, values), { onConflict: 'mid' })
    if (error) throw error
  },

  async updateSettings(userId: string, values: Partial<Omit<UserSettings, 'userId'>>): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('user_settings').upsert(settingsPayload(userId, values), { onConflict: 'mid' })
    if (error) throw error
  },
}
