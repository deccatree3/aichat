import { supabase } from '../auth/supabase'

export const reportService = {
  async create(input: {
    reporterMid: string
    targetType: 'creator' | 'plot' | 'hashtag' | 'user'
    targetId: string
    targetLabel?: string
    reason: string
    detail?: string
  }): Promise<void> {
    if (!supabase) return

    const { error } = await supabase.from('reports').insert({
      reporter_mid: input.reporterMid,
      target_type: input.targetType,
      target_id: input.targetId,
      target_label: input.targetLabel ?? null,
      reason: input.reason,
      detail: input.detail ?? null,
    })

    if (error) throw error
  },
}
