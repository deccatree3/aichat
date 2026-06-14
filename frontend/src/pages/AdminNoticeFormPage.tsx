import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { markdownToPlainBlocks } from '../notices/markdown'
import { noticeService } from '../notices/noticeService'
import type { NoticeFormValues, NoticeStatus } from '../notices/types'

const emptyForm: NoticeFormValues = {
  title: '',
  bodyMarkdown: '',
  status: 'draft',
  isPinned: false,
  publishedAt: '',
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function AdminNoticeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const isEdit = Boolean(id)
  const [values, setValues] = useState<NoticeFormValues>(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewBlocks = useMemo(() => markdownToPlainBlocks(values.bodyMarkdown), [values.bodyMarkdown])

  useEffect(() => {
    let mounted = true
    if (!id) return

    noticeService
      .getForAdmin(id)
      .then((notice) => {
        if (!mounted || !notice) return
        setValues({
          title: notice.title,
          bodyMarkdown: notice.bodyMarkdown,
          status: notice.status,
          isPinned: notice.isPinned,
          publishedAt: toDatetimeLocal(notice.publishedAt),
        })
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

  if (!user) return <Navigate to="/" replace />

  const updateValue = <K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!values.title.trim() || !values.bodyMarkdown.trim()) {
      setError('제목과 본문을 입력하세요.')
      return
    }

    setSaving(true)
    try {
      const notice = id
        ? await noticeService.update(id, values, user.uid)
        : await noticeService.create(values, user.uid)
      navigate(`/admin/notices/${notice.id}/edit`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page notice-page admin-notice-page">
      <header className="notice-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>{isEdit ? '공지 수정' : '공지 작성'}</h1>
        <span />
      </header>

      {loading ? (
        <p className="notice-state">불러오는 중입니다.</p>
      ) : (
        <form className="admin-notice-form" onSubmit={handleSubmit}>
          <label>
            <strong>제목</strong>
            <input value={values.title} onChange={(event) => updateValue('title', event.target.value)} maxLength={120} />
          </label>

          <label>
            <strong>상태</strong>
            <select value={values.status} onChange={(event) => updateValue('status', event.target.value as NoticeStatus)}>
              <option value="draft">초안</option>
              <option value="published">공개</option>
              <option value="archived">보관</option>
            </select>
          </label>

          <label>
            <strong>공개일</strong>
            <input
              type="datetime-local"
              value={values.publishedAt}
              onChange={(event) => updateValue('publishedAt', event.target.value)}
            />
          </label>

          <label className="admin-notice-check">
            <input
              type="checkbox"
              checked={values.isPinned}
              onChange={(event) => updateValue('isPinned', event.target.checked)}
            />
            <strong>상단 고정</strong>
          </label>

          <label>
            <strong>본문 Markdown</strong>
            <textarea value={values.bodyMarkdown} onChange={(event) => updateValue('bodyMarkdown', event.target.value)} />
          </label>

          <section className="admin-notice-preview" aria-label="공지 미리보기">
            <h2>{values.title || '제목 미리보기'}</h2>
            {previewBlocks.length === 0 ? <p>본문 미리보기</p> : previewBlocks.map((block) => <p key={block}>{block}</p>)}
          </section>

          {error && <p className="notice-state notice-state--error">{error}</p>}

          <div className="admin-notice-actions">
            <button type="submit" disabled={saving}>{saving ? '저장 중' : '저장'}</button>
          </div>
        </form>
      )}
    </main>
  )
}
