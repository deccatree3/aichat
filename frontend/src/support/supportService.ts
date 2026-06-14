import { supabase } from '../auth/supabase'
import { fallbackCategories, fallbackContactDetail, fallbackContacts, fallbackFaqs } from './fallbackData'
import type { Contact, ContactDetail, ContactReply, ContactStatus, Faq, SupportCategory } from './types'

type CategoryRow = {
  id: string
  name: string
  description: string | null
  sort_order: number
}

type FaqRow = {
  id: string
  category_id: string
  title: string
  body_markdown: string
  is_popular: boolean
  sort_order: number
  created_at: string
  updated_at: string
  support_categories: { name: string } | null
}

type ContactRow = {
  id: string
  mid: string
  category_id: string | null
  title: string
  body: string
  status: ContactStatus
  created_at: string
  updated_at: string
  support_categories: { name: string } | null
}

type ReplyRow = {
  id: string
  contact_id: string
  author_uid: string | null
  body: string
  is_staff: boolean
  created_at: string
}

function toCategory(row: CategoryRow): SupportCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  }
}

function toFaq(row: FaqRow): Faq {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.support_categories?.name ?? '기타',
    title: row.title,
    bodyMarkdown: row.body_markdown,
    isPopular: row.is_popular,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    userId: row.mid,
    categoryId: row.category_id,
    categoryName: row.support_categories?.name ?? null,
    title: row.title,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toReply(row: ReplyRow): ContactReply {
  return {
    id: row.id,
    contactId: row.contact_id,
    authorId: row.author_uid,
    body: row.body,
    isStaff: row.is_staff,
    createdAt: row.created_at,
  }
}

export const supportService = {
  async listCategories(): Promise<SupportCategory[]> {
    if (!supabase) return fallbackCategories

    const { data, error } = await supabase
      .from('support_categories')
      .select('id,name,description,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.warn('Failed to load support categories:', error.message)
      return []
    }
    return (data as CategoryRow[]).map(toCategory)
  },

  async listFaqs(categoryId?: string): Promise<Faq[]> {
    if (!supabase) {
      return categoryId ? fallbackFaqs.filter((faq) => faq.categoryId === categoryId) : fallbackFaqs
    }

    let query = supabase
      .from('faqs')
      .select('id,category_id,title,body_markdown,is_popular,sort_order,created_at,updated_at,support_categories(name)')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false })

    if (categoryId) query = query.eq('category_id', categoryId)

    const { data, error } = await query
    if (error) {
      console.warn('Failed to load FAQs:', error.message)
      return []
    }
    return (data as unknown as FaqRow[]).map(toFaq)
  },

  async listPopularFaqs(): Promise<Faq[]> {
    const faqs = await this.listFaqs()
    return faqs.filter((faq) => faq.isPopular).slice(0, 5)
  },

  async getFaq(id: string): Promise<Faq | null> {
    if (!supabase) return fallbackFaqs.find((faq) => faq.id === id) ?? null

    const { data, error } = await supabase
      .from('faqs')
      .select('id,category_id,title,body_markdown,is_popular,sort_order,created_at,updated_at,support_categories(name)')
      .eq('id', id)
      .eq('status', 'published')
      .maybeSingle()

    if (error) {
      console.warn('Failed to load FAQ:', error.message)
      return null
    }
    return data ? toFaq(data as unknown as FaqRow) : null
  },

  async searchFaqs(query: string): Promise<Faq[]> {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []

    if (!supabase) {
      return fallbackFaqs.filter((faq) =>
        `${faq.title} ${faq.bodyMarkdown} ${faq.categoryName}`.toLowerCase().includes(normalized),
      )
    }

    const { data, error } = await supabase
      .from('faqs')
      .select('id,category_id,title,body_markdown,is_popular,sort_order,created_at,updated_at,support_categories(name)')
      .eq('status', 'published')
      .or(`title.ilike.%${normalized}%,body_markdown.ilike.%${normalized}%`)
      .order('is_popular', { ascending: false })
      .order('sort_order', { ascending: true })

    if (error) {
      console.warn('Failed to search FAQs:', error.message)
      return []
    }
    return (data as unknown as FaqRow[]).map(toFaq)
  },

  async listContacts(userId: string): Promise<Contact[]> {
    if (!supabase) return fallbackContacts(userId)

    const { data, error } = await supabase
      .from('contacts')
      .select('id,mid,category_id,title,body,status,created_at,updated_at,support_categories(name)')
      .eq('mid', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.warn('Failed to load contacts:', error.message)
      return []
    }
    return (data as unknown as ContactRow[]).map(toContact)
  },

  async getContact(userId: string, id: string): Promise<ContactDetail | null> {
    if (!supabase) return fallbackContactDetail(userId, id)

    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id,mid,category_id,title,body,status,created_at,updated_at,support_categories(name)')
      .eq('id', id)
      .eq('mid', userId)
      .maybeSingle()

    if (contactError) throw contactError
    if (!contactData) return null

    const { data: replyData, error: replyError } = await supabase
      .from('contact_replies')
      .select('id,contact_id,author_uid,body,is_staff,created_at')
      .eq('contact_id', id)
      .order('created_at', { ascending: true })

    if (replyError) throw replyError
    return {
      contact: toContact(contactData as unknown as ContactRow),
      replies: (replyData as ReplyRow[]).map(toReply),
    }
  },

  async createContact(userId: string, values: { categoryId: string; title: string; body: string }): Promise<Contact> {
    if (!supabase) {
      return {
        id: `contact-${Date.now()}`,
        userId,
        categoryId: values.categoryId,
        categoryName: fallbackCategories.find((category) => category.id === values.categoryId)?.name ?? null,
        title: values.title.trim(),
        body: values.body.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        mid: userId,
        category_id: values.categoryId || null,
        title: values.title.trim(),
        body: values.body.trim(),
      })
      .select('id,mid,category_id,title,body,status,created_at,updated_at,support_categories(name)')
      .single()

    if (error) throw error
    return toContact(data as unknown as ContactRow)
  },
}
