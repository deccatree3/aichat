export type ContactStatus = 'open' | 'answered' | 'closed'

export interface SupportCategory {
  id: string
  name: string
  description: string | null
  sortOrder: number
}

export interface Faq {
  id: string
  categoryId: string
  categoryName: string
  title: string
  bodyMarkdown: string
  isPopular: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  userId: string
  categoryId: string | null
  categoryName: string | null
  title: string
  body: string
  status: ContactStatus
  createdAt: string
  updatedAt: string
}

export interface ContactReply {
  id: string
  contactId: string
  authorId: string | null
  body: string
  isStaff: boolean
  createdAt: string
}

export interface ContactDetail {
  contact: Contact
  replies: ContactReply[]
}
