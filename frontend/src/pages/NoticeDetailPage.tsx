import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { markdownToPlainBlocks } from '../notices/markdown'
import { noticeService } from '../notices/noticeService'
import type { Notice } from '../notices/types'

export default function NoticeDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    if (!id) return

    noticeService
      .getPublished(id)
      .then((item) => {
        if (!mounted) return
        if (item) setNotice(item)
        else setNotFound(true)
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
  }, [id])

  if (!id) return <Navigate to="/announcements" replace />
  if (notFound) return <Navigate to="/announcements" replace />

  return (
    <main className="page notice-page">
      <header className="notice-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>공지사항</h1>
        <span />
      </header>

      {loading && <p className="notice-state">불러오는 중입니다.</p>}
      {error && <p className="notice-state notice-state--error">{error}</p>}
      {notice && (
        <article className="notice-detail">
          <h2>{notice.title}</h2>
          <time>{notice.publishedAt?.slice(0, 10) ?? notice.createdAt.slice(0, 10)}</time>
          <div>
            {markdownToPlainBlocks(notice.bodyMarkdown).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      )}
    </main>
  )
}
