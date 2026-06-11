import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supportService } from '../support/supportService'
import type { SupportCategory } from '../support/types'

export default function SupportContactCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [categories, setCategories] = useState<SupportCategory[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    supportService.listCategories().then((items) => {
      if (!mounted) return
      setCategories(items)
      setCategoryId((current) => current || items[0]?.id || '')
    })
    return () => {
      mounted = false
    }
  }, [])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    if (!title.trim() || !body.trim()) {
      setError('제목과 문의 내용을 입력하세요.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const contact = await supportService.createContact(user.id, { categoryId, title, body })
      navigate(`/customer-center/contacts/${contact.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page support-page">
      <header className="support-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>문의 작성</h1>
        <span />
      </header>

      {!user ? (
        <section className="support-empty">
          <h2>로그인이 필요합니다</h2>
          <p>1:1 문의는 로그인 후 작성할 수 있습니다.</p>
          <Link to="/login">로그인</Link>
        </section>
      ) : (
        <form className="support-form" onSubmit={submit}>
          <label>
            <strong>문의 유형</strong>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            <strong>제목</strong>
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
          </label>
          <label>
            <strong>문의 내용</strong>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} />
          </label>
          {error && <p className="notice-state notice-state--error">{error}</p>}
          <button className="support-submit" type="submit" disabled={saving}>{saving ? '등록 중' : '문의 등록'}</button>
        </form>
      )}
    </main>
  )
}
