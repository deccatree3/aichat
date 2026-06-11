import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supportService } from '../support/supportService'
import type { ContactDetail } from '../support/types'

export default function SupportContactDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [detail, setDetail] = useState<ContactDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(user && id))
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!user || !id) return

    supportService
      .getContact(user.id, id)
      .then((item) => {
        if (!mounted) return
        if (item) setDetail(item)
        else setNotFound(true)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id, user])

  if (!id || notFound) return <Navigate to="/customer-center/contacts" replace />

  return (
    <main className="page support-page">
      <header className="support-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>문의 상세</h1>
        <span />
      </header>

      {!user && <Navigate to="/login" replace />}
      {loading && <p className="notice-state">불러오는 중입니다.</p>}
      {detail && (
        <article className="support-contact-detail">
          <header>
            <small>{detail.contact.categoryName ?? '기타'} · {detail.contact.createdAt.slice(0, 10)}</small>
            <h2>{detail.contact.title}</h2>
          </header>
          <div className="support-thread support-thread--user">
            <strong>문의 내용</strong>
            <p>{detail.contact.body}</p>
          </div>
          {detail.replies.map((reply) => (
            <div className={reply.isStaff ? 'support-thread support-thread--staff' : 'support-thread support-thread--user'} key={reply.id}>
              <strong>{reply.isStaff ? '고객센터 답변' : '추가 문의'}</strong>
              <time>{reply.createdAt.slice(0, 10)}</time>
              <p>{reply.body}</p>
            </div>
          ))}
        </article>
      )}
    </main>
  )
}
