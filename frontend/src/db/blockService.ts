import { supabase } from '../auth/supabase'

export type BlockTargetType = 'creator' | 'plot' | 'hashtag'

export interface UserBlock {
  id: string
  targetType: BlockTargetType
  targetId: string
  targetLabel: string
}

interface BlockRow {
  id: string
  target_type: BlockTargetType
  target_id: string
  target_label: string
}

function toBlock(row: BlockRow): UserBlock {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
  }
}

export const blockService = {
  async list(userId: string, targetType: BlockTargetType): Promise<UserBlock[]> {
    if (!supabase) return []

    const { data, error } = await supabase
      .from('user_blocks')
      .select('id,target_type,target_id,target_label')
      .eq('mid', userId)
      .eq('target_type', targetType)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data as BlockRow[]).map(toBlock)
  },

  async create(userId: string, targetType: BlockTargetType, targetId: string, targetLabel: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('user_blocks').upsert(
      {
        mid: userId,
        target_type: targetType,
        target_id: targetId,
        target_label: targetLabel,
      },
      { onConflict: 'mid,target_type,target_id' },
    )

    if (error) throw error
  },

  async remove(id: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('user_blocks').delete().eq('id', id)
    if (error) throw error
  },
}
