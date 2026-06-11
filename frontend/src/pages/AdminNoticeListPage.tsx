import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { noticeService } from '../notices/noticeService'
import type { Notice, NoticeStatus } from '../notices/types'

const filters: Array<NoticeStatus | 'all'> = ['all', 'published', 'draft', 'archived']

function labelForStatus(status: NoticeStatus | 'all') {
  if (status === 'all') return '전체'
  if (status === 'published') return '공개'
  if (status === 'draft') return '초안'
  return '보관'
}

export default function AdminNoticeListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status') as NoticeStatus | 'all' | null
  const status = statusParam && filters.includes(statusParam) ? statusParam : 'all'
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    noticeService
      .listForAdmin(status)
      .then((items) => {
        if (mounted) setNotices(items)
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [status])

  return (
    <main className="page notice-page admin-notice-page">
      <header className="notice-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>공지 관리</h1>
        <Link className="admin-icon-link" to="/admin/notices/new" aria-label="작성">+</Link>
      </header>

      <div className="admin-notice-tabs" role="tablist" aria-label="공지 상태 필터">
        {filters.map((item) => (
          <button
            className={item === status ? 'is-active' : ''}
            key={item}
            onClick={() => setSearchParams(item === 'all' ? {} : { status: item })}
          >
            {labelForStatus(item)}
          </button>
        ))}
      </div>

      {loading && <p className="notice-state">불러오는 중입니다.</p>}
      {error && <p className="notice-state notice-state--error">{error}</p>}
      {!loading && !error && notices.length === 0 && <p className="notice-state">공지사항이 없습니다.</p>}

      <section className="notice-list" aria-label="관리자 공지 목록">
        {notices.map((notice) => (
          <Link className="notice-list__item admin-notice-item" to={`/admin/notices/${notice.id}/edit`} key={notice.id}>
            <span>
              <strong>{notice.isPinned ? '[고정] ' : ''}{notice.title}</strong>
              <time>{labelForStatus(notice.status)} · {notice.publishedAt?.slice(0, 10) ?? '공개일 없음'}</time>
            </span>
            <b aria-hidden="true">›</b>
          </Link>
        ))}
      </section>
    </main>
  )
}
