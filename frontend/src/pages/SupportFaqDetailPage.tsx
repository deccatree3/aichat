import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { markdownToBlocks } from '../support/markdown'
import { supportService } from '../support/supportService'
import type { Faq } from '../support/types'

export default function SupportFaqDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [faq, setFaq] = useState<Faq | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!id) return

    supportService
      .getFaq(id)
      .then((item) => {
        if (!mounted) return
        if (item) setFaq(item)
        else setNotFound(true)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id])

  if (!id || notFound) return <Navigate to="/customer-center/faqs" replace />

  return (
    <main className="page support-page">
      <header className="support-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>FAQ</h1>
        <span />
      </header>

      {loading && <p className="notice-state">불러오는 중입니다.</p>}
      {faq && (
        <article className="support-detail">
          <small>{faq.categoryName}</small>
          <h2>{faq.title}</h2>
          <div>
            {markdownToBlocks(faq.bodyMarkdown).map((block) => (
              <p key={block}>{block}</p>
            ))}
          </div>
        </article>
      )}
    </main>
  )
}
