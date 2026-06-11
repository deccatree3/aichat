import { supabase } from '../auth/supabase'
import { notices as fallbackNotices } from '../data/notices'
import type { Notice, NoticeFormValues, NoticeStatus } from './types'

type NoticeRow = {
  id: string
  title: string
  body_markdown: string
  status: NoticeStatus
  is_pinned: boolean
  published_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

function toNotice(row: NoticeRow): Notice {
  return {
    id: row.id,
    title: row.title,
    bodyMarkdown: row.body_markdown,
    status: row.status,
    isPinned: row.is_pinned,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function fallbackAsNotices(): Notice[] {
  return fallbackNotices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    bodyMarkdown: notice.body.join('\n\n'),
    status: 'published',
    isPinned: false,
    publishedAt: `${notice.date}T00:00:00.000Z`,
    createdBy: null,
    updatedBy: null,
    createdAt: `${notice.date}T00:00:00.000Z`,
    updatedAt: `${notice.date}T00:00:00.000Z`,
  }))
}

function formatPayload(values: NoticeFormValues, userId: string) {
  const title = values.title.trim()
  const bodyMarkdown = values.bodyMarkdown.trim()
  const publishedAt =
    values.status === 'published' && !values.publishedAt
      ? new Date().toISOString()
      : values.publishedAt
        ? new Date(values.publishedAt).toISOString()
        : null

  return {
    title,
    body_markdown: bodyMarkdown,
    status: values.status,
    is_pinned: values.isPinned,
    published_at: publishedAt,
    updated_by: userId,
  }
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export const noticeService = {
  async listPublished(): Promise<Notice[]> {
    if (!supabase) return fallbackAsNotices()

    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('Falling back to bundled notices:', error.message)
      return fallbackAsNotices()
    }

    return (data as NoticeRow[]).map(toNotice)
  },

  async getPublished(id: string): Promise<Notice | null> {
    if (!supabase) {
      return fallbackAsNotices().find((notice) => notice.id === id) ?? null
    }

    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .maybeSingle()

    if (error) {
      console.warn('Falling back to bundled notice:', error.message)
      return fallbackAsNotices().find((notice) => notice.id === id) ?? null
    }

    return data ? toNotice(data as NoticeRow) : null
  },

  async isCurrentUserAdmin(userId: string): Promise<boolean> {
    if (!supabase) return userId === 'u_mock_0001'

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return false
    return Boolean(data)
  },

  async listForAdmin(status: NoticeStatus | 'all'): Promise<Notice[]> {
    const client = requireSupabase()
    let query = client
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })

    if (status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return (data as NoticeRow[]).map(toNotice)
  },

  async getForAdmin(id: string): Promise<Notice | null> {
    const client = requireSupabase()
    const { data, error } = await client.from('notices').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? toNotice(data as NoticeRow) : null
  },

  async create(values: NoticeFormValues, userId: string): Promise<Notice> {
    const client = requireSupabase()
    const payload = {
      ...formatPayload(values, userId),
      created_by: userId,
    }

    const { data, error } = await client.from('notices').insert(payload).select('*').single()
    if (error) throw error
    return toNotice(data as NoticeRow)
  },

  async update(id: string, values: NoticeFormValues, userId: string): Promise<Notice> {
    const client = requireSupabase()
    const { data, error } = await client
      .from('notices')
      .update(formatPayload(values, userId))
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return toNotice(data as NoticeRow)
  },

}
