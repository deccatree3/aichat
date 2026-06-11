import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { noticeService } from '../notices/noticeService'
import type { Notice } from '../notices/types'

export default function NoticeListPage() {
  const navigate = useNavigate()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    noticeService
      .listPublished()
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
  }, [])

  return (
    <main className="page notice-page">
      <header className="notice-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>공지사항</h1>
        <span />
      </header>

      {loading && <p className="notice-state">불러오는 중입니다.</p>}
      {error && <p className="notice-state notice-state--error">{error}</p>}
      {!loading && !error && notices.length === 0 && <p className="notice-state">등록된 공지사항이 없습니다.</p>}

      <section className="notice-list" aria-label="공지사항 목록">
        {notices.map((notice) => (
          <Link className="notice-list__item" to={`/announcements/${notice.id}`} key={notice.id}>
            <span>
              <strong>{notice.isPinned ? '[고정] ' : ''}{notice.title}</strong>
              <time>{notice.publishedAt?.slice(0, 10) ?? notice.createdAt.slice(0, 10)}</time>
            </span>
            <b aria-hidden="true">›</b>
          </Link>
        ))}
      </section>
    </main>
  )
}
