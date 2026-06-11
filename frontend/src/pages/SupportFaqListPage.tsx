import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { supportService } from '../support/supportService'
import type { Faq, SupportCategory } from '../support/types'

export default function SupportFaqListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') ?? ''
  const [categories, setCategories] = useState<SupportCategory[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    Promise.all([supportService.listCategories(), supportService.listFaqs(selectedCategory || undefined)])
      .then(([nextCategories, nextFaqs]) => {
        if (!mounted) return
        setCategories(nextCategories)
        setFaqs(nextFaqs)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [selectedCategory])

  const title = useMemo(() => {
    return categories.find((category) => category.id === selectedCategory)?.name ?? '전체 FAQ'
  }, [categories, selectedCategory])

  return (
    <main className="page support-page">
      <header className="support-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>FAQ</h1>
        <span />
      </header>

      <div className="support-chip-row" aria-label="FAQ 카테고리">
        <button className={!selectedCategory ? 'is-active' : ''} onClick={() => setSearchParams({})}>전체</button>
        {categories.map((category) => (
          <button
            className={selectedCategory === category.id ? 'is-active' : ''}
            key={category.id}
            onClick={() => setSearchParams({ category: category.id })}
          >
            {category.name}
          </button>
        ))}
      </div>

      <section className="support-block">
        <h2>{title}</h2>
        {loading && <p className="notice-state">불러오는 중입니다.</p>}
        {!loading && faqs.length === 0 && <p className="notice-state">등록된 FAQ가 없습니다.</p>}
        <div className="support-faq">
          {faqs.map((faq) => (
            <Link to={`/customer-center/faqs/${faq.id}`} key={faq.id}>
              <span>
                <strong>{faq.title}</strong>
                <small>{faq.categoryName}</small>
              </span>
              <b aria-hidden="true">›</b>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
