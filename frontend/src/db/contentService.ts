import { supabase } from '../auth/supabase'

export interface PlotSummary {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  tags: string[]
  thumbnailUrl: string | null
  chatCount: number
  rankScore: number
}

interface PlotRow {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  tags: string[] | null
  thumbnail_url: string | null
  chat_count: number
  rank_score: number
}

function toPlot(row: PlotRow): PlotSummary {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    tags: row.tags ?? [],
    thumbnailUrl: row.thumbnail_url,
    chatCount: Number(row.chat_count ?? 0),
    rankScore: Number(row.rank_score ?? 0),
  }
}

export const contentService = {
  async listHomePlots(): Promise<PlotSummary[]> {
    if (!supabase) return []

    const { data, error } = await supabase
      .from('plots')
      .select('id,title,subtitle,description,tags,thumbnail_url,chat_count,rank_score')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return []
    return (data as PlotRow[]).map(toPlot)
  },

  async listRankingPlots(mode: 'trending' | 'best' | 'new'): Promise<PlotSummary[]> {
    if (!supabase) return []

    let query = supabase
      .from('plots')
      .select('id,title,subtitle,description,tags,thumbnail_url,chat_count,rank_score')
      .eq('status', 'published')
      .limit(20)

    if (mode === 'new') {
      query = query.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
    } else if (mode === 'best') {
      query = query.order('chat_count', { ascending: false }).order('rank_score', { ascending: false })
    } else {
      query = query.order('rank_score', { ascending: false }).order('chat_count', { ascending: false })
    }

    const { data, error } = await query
    if (error) return []
    return (data as PlotRow[]).map(toPlot)
  },
}
