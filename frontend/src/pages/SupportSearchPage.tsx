import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supportService } from '../support/supportService'
import type { Faq } from '../support/types'

export default function SupportSearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('query') ?? ''
  const [value, setValue] = useState(query)
  const [results, setResults] = useState<Faq[]>([])

  useEffect(() => {
    let mounted = true
    if (!query.trim()) return

    supportService
      .searchFaqs(query)
      .then((items) => {
        if (mounted) setResults(items)
      })

    return () => {
      mounted = false
    }
  }, [query])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (trimmed) setSearchParams({ query: trimmed })
  }

  return (
    <main className="page support-page">
      <header className="support-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>검색</h1>
        <span />
      </header>

      <form className="support-search support-search--page" onSubmit={submit}>
        <input value={value} onChange={(event) => setValue(event.target.value)} autoFocus placeholder="검색어 입력" />
        <button type="submit" aria-label="검색">⌕</button>
      </form>

      {query && results.length === 0 && <p className="notice-state">검색 결과가 없습니다.</p>}

      <section className="support-faq support-search-results">
        {results.map((faq) => (
          <Link to={`/customer-center/faqs/${faq.id}`} key={faq.id}>
            <span>
              <strong>{faq.title}</strong>
              <small>{faq.categoryName}</small>
            </span>
            <b aria-hidden="true">›</b>
          </Link>
        ))}
      </section>
    </main>
  )
}
