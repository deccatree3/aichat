import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supportService } from '../support/supportService'
import type { Contact } from '../support/types'

function statusLabel(status: Contact['status']) {
  if (status === 'answered') return '답변 완료'
  if (status === 'closed') return '종료'
  return '접수'
}

export default function SupportContactListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(Boolean(user))

  useEffect(() => {
    let mounted = true
    if (!user) return

    supportService
      .listContacts(user.id)
      .then((items) => {
        if (mounted) setContacts(items)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [user])

  return (
    <main className="page support-page">
      <header className="support-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>1:1 문의</h1>
        <Link className="support-header-action" to="/customer-center/contacts/create">작성</Link>
      </header>

      {!user && (
        <section className="support-empty">
          <h2>로그인이 필요합니다</h2>
          <p>문의 내역은 로그인 후 확인할 수 있습니다.</p>
          <Link to="/login">로그인</Link>
        </section>
      )}

      {user && loading && <p className="notice-state">불러오는 중입니다.</p>}
      {user && !loading && contacts.length === 0 && (
        <section className="support-empty">
          <h2>문의 내역이 없습니다</h2>
          <p>궁금한 점을 남기면 답변을 받을 수 있습니다.</p>
          <Link to="/customer-center/contacts/create">문의 작성</Link>
        </section>
      )}

      <section className="support-contact-list">
        {contacts.map((contact) => (
          <Link to={`/customer-center/contacts/${contact.id}`} key={contact.id}>
            <span>
              <strong>{contact.title}</strong>
              <small>{contact.categoryName ?? '기타'} · {contact.createdAt.slice(0, 10)}</small>
            </span>
            <em>{statusLabel(contact.status)}</em>
          </Link>
        ))}
      </section>
    </main>
  )
}
