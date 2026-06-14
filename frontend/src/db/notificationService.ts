import { supabase } from '../auth/supabase'

export interface NotificationPreference {
  category: string
  key: string
  enabled: boolean
}

interface PreferenceRow {
  category: string
  key: string
  enabled: boolean
}

export const notificationService = {
  async list(userId: string, category: string, defaults: Record<string, boolean>): Promise<Record<string, boolean>> {
    if (!supabase) return defaults

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('category,key,enabled')
      .eq('mid', userId)
      .eq('category', category)

    if (error) return defaults

    return (data as PreferenceRow[]).reduce(
      (state, row) => ({ ...state, [row.key]: row.enabled }),
      defaults,
    )
  },

  async set(userId: string, category: string, key: string, enabled: boolean): Promise<void> {
    if (!supabase) return
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ mid: userId, category, key, enabled }, { onConflict: 'mid,category,key' })

    if (error) throw error
  },
}
