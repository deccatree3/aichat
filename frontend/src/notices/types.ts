export type NoticeStatus = 'draft' | 'published' | 'archived'

export interface Notice {
  id: string
  title: string
  bodyMarkdown: string
  status: NoticeStatus
  isPinned: boolean
  publishedAt: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface NoticeFormValues {
  title: string
  bodyMarkdown: string
  status: NoticeStatus
  isPinned: boolean
  publishedAt: string
}
