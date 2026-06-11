import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { noticeService } from '../notices/noticeService'
import type { Notice } from '../notices/types'
import { supportService } from '../support/supportService'
import type { Faq, SupportCategory } from '../support/types'

export default function CustomerCenterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<SupportCategory[]>([])
  const [popularFaqs, setPopularFaqs] = useState<Faq[]>([])
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    let mounted = true

    Promise.all([supportService.listCategories(), supportService.listPopularFaqs(), noticeService.listPublished()])
      .then(([nextCategories, nextFaqs, nextNotices]) => {
        if (!mounted) return
        setCategories(nextCategories)
        setPopularFaqs(nextFaqs)
        setNotices(nextNotices.slice(0, 3))
      })
      .catch((error: Error) => {
        console.warn(error.message)
      })

    return () => {
      mounted = false
    }
  }, [])

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) navigate(`/customer-center/search?query=${encodeURIComponent(trimmed)}`)
  }

  return (
    <main className="page support-page">
      <header className="support-desktop-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로" className="support-mobile-back">‹</button>
        <Link to="/customer-center" className="support-brand"><strong>zeta</strong> 고객센터</Link>
        <span>{user?.nickname ?? '로그인'}</span>
      </header>

      <section className="support-hero support-hero--cover">
        <h2>무엇을 도와드릴까요?</h2>
        <form className="support-search" onSubmit={submitSearch}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="키워드로 검색해 보세요"
            aria-label="고객센터 검색"
          />
          <button type="submit" aria-label="검색">⌕</button>
        </form>
      </section>

      <section className="support-block">
        <div className="support-block__head">
          <div>
            <h2>카테고리로 찾기</h2>
            <p>궁금한 주제를 골라보세요</p>
          </div>
        </div>
        <div className="support-categories">
          {categories.map((category) => (
            <Link to={`/customer-center/faqs?category=${category.id}`} key={category.id}>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="support-block">
        <div className="support-block__head">
          <div>
            <h2>많이 찾는 질문</h2>
            <p>다른 유저들이 자주 본 질문이에요</p>
          </div>
        </div>
        <div className="support-faq">
          {popularFaqs.map((faq) => (
            <Link to={`/customer-center/faqs/${faq.id}`} key={faq.id}>
              <span>
                <strong>{faq.title}</strong>
              </span>
              <b aria-hidden="true">›</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="support-block">
        <div className="support-block__head">
          <div>
            <h2>공지사항</h2>
            <p>업데이트/이벤트 소식을 확인해 보세요</p>
          </div>
          <Link to="/announcements">전체보기 ›</Link>
        </div>
        <div className="support-faq support-notice-list">
          {notices.map((notice) => (
            <Link to={`/announcements/${notice.id}`} key={notice.id}>
              <span>
                <strong>{notice.title}</strong>
                <small>{notice.publishedAt?.slice(0, 10) ?? notice.createdAt.slice(0, 10)}</small>
              </span>
              <b aria-hidden="true">›</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="support-contact-cta">
        <strong>문제가 해결되지 않았나요?</strong>
        <div>
          <Link to="/customer-center/contacts/create">1:1 문의하기</Link>
          <Link to="/customer-center/contacts">나의 문의 내역</Link>
        </div>
      </section>

      <footer className="support-footer">
        <strong>캐처스</strong>
        <p>상호명: (주)캐처스</p>
        <p>대표자명: 박은상 | 개인정보보호책임자: 박은상</p>
        <p>사업장 주소: 06626 서울 서초구 강남대로 341, 8층 831호</p>
        <p>대표 전화: 1577-6037 | 이메일: admin@katchers.co.kr</p>
        <p>사업자 등록번호: 556-81-02489</p>
        <p>통신판매업 신고번호: 제 2022-서울서초-1505호</p>
        <nav>
          <a href="#">개인정보처리방침</a>
          <a href="#">이용약관</a>
          <a href="#">운영정책</a>
          <a href="#">청소년보호정책</a>
        </nav>
      </footer>
    </main>
  )
}
