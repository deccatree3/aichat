import { supabase } from '../auth/supabase'

export interface ConversationProfile {
  id: number
  userId: string
  name: string
  description: string | null
  avatarUrl: string | null
  isDefault: boolean
}

export interface ConversationProfilePatch {
  id?: number
  name: string
  description?: string | null
  isDefault?: boolean
}

interface ConversationProfileRow {
  id: number
  mid: string
  name: string
  description: string | null
  avatar_url: string | null
  is_default: boolean
}

function toConversationProfile(row: ConversationProfileRow): ConversationProfile {
  return {
    id: Number(row.id),
    userId: String(row.mid),
    name: row.name,
    description: row.description,
    avatarUrl: row.avatar_url,
    isDefault: row.is_default,
  }
}

export const conversationProfileService = {
  async list(userId: string): Promise<ConversationProfile[]> {
    if (!supabase) return []

    const { data, error } = await supabase
      .from('conversation_profiles')
      .select('id,mid,name,description,avatar_url,is_default')
      .eq('mid', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) return []
    return (data as ConversationProfileRow[]).map(toConversationProfile)
  },

  async save(userId: string, values: ConversationProfilePatch): Promise<ConversationProfile> {
    if (!supabase) {
      return {
        id: values.id ?? Date.now(),
        userId,
        name: values.name.trim(),
        description: values.description ?? null,
        avatarUrl: null,
        isDefault: Boolean(values.isDefault),
      }
    }

    if (values.isDefault) {
      await supabase
        .from('conversation_profiles')
        .update({ is_default: false })
        .eq('mid', userId)
    }

    const payload = {
      id: values.id,
      mid: userId,
      name: values.name.trim(),
      description: values.description?.trim() || null,
      is_default: Boolean(values.isDefault),
    }

    const query = values.id
      ? supabase.from('conversation_profiles').update(payload).eq('id', values.id).eq('mid', userId)
      : supabase.from('conversation_profiles').insert(payload)

    const { data, error } = await query
      .select('id,mid,name,description,avatar_url,is_default')
      .single()

    if (error) throw error
    return toConversationProfile(data as ConversationProfileRow)
  },

  async ensureDefault(userId: string, name: string): Promise<void> {
    const existing = await this.list(userId)
    if (existing.length) return
    await this.save(userId, { name, description: null, isDefault: true })
  },
}
