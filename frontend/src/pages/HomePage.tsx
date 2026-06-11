import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import BottomNav from '../components/BottomNav'

interface Props {
  mode?: 'home' | 'ranking'
  title?: string
  onLoginRequired: () => void
}

type RankingTab = 'trending' | 'best' | 'new'

const cards = [
  { name: '깊은 밤의 진', tag: '로맨스 · 학원물', desc: '어색한 사이에서 시작되는 비밀스러운 대화.' },
  { name: '일진과 서현', tag: '드라마 · 긴장감', desc: '말을 빌려달라는 친구의 진짜 목적은 무엇일까?' },
  { name: '가출소녀 지우', tag: '감정 · 서사', desc: '배고픔과 외로움 사이에서 이어지는 이야기.' },
  { name: '주석현', tag: '집착 · CEO', desc: '차갑고 위험한 관계가 서서히 드러난다.' },
]

type PlotCard = (typeof cards)[number] & { rank?: number }

const rankingLabels: Record<RankingTab, string> = {
  trending: '트렌딩',
  best: '베스트',
  new: '신작',
}

export default function HomePage({ mode = 'home', title, onLoginRequired }: Props) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const routeToast = (location.state as { toast?: string } | null)?.toast ?? ''
  const [rankingTab, setRankingTab] = useState<RankingTab>('trending')
  const [toast, setToast] = useState(routeToast)
  const visibleCards: PlotCard[] = mode === 'ranking'
    ? cards.map((card, index) => ({ ...card, rank: index + 1, tag: `${rankingLabels[rankingTab]} · ${card.tag}` }))
    : cards

  useEffect(() => {
    if (!toast) return undefined
    navigate(location.pathname, { replace: true, state: null })
    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [location.pathname, navigate, toast])

  return (
    <main className="page with-nav">
      {toast && (
        <div className="chat-toast" role="status">
          <span aria-hidden="true">✓</span>
          <strong>{toast}</strong>
        </div>
      )}
      <header className="home-topbar">
        {title ? (
          <h1>{title}</h1>
        ) : (
          <nav className="primary-tabs" aria-label="주요 메뉴">
            <NavLink to="/" end>홈</NavLink>
            <NavLink to="/ranking">랭킹</NavLink>
          </nav>
        )}
        <div className="home-topbar__actions">
          <button className="icon-action" aria-label="검색">
            <SearchIcon />
          </button>
          {user ? (
            <button className="icon-action bell-action" aria-label="알림">
              <BellIcon />
            </button>
          ) : (
            <button className="login-chip" onClick={onLoginRequired}>로그인</button>
          )}
        </div>
      </header>
      {mode === 'ranking' && (
        <div className="sub-tabs" role="tablist" aria-label="랭킹 종류">
          {(Object.keys(rankingLabels) as RankingTab[]).map((tab) => (
            <button
              key={tab}
              className={rankingTab === tab ? 'active' : ''}
              onClick={() => setRankingTab(tab)}
              role="tab"
              aria-selected={rankingTab === tab}
            >
              {rankingLabels[tab]}
            </button>
          ))}
        </div>
      )}
      <section className="plot-grid" aria-label="추천 플롯">
        {visibleCards.map((card) => (
          <article className="plot-card" key={card.name}>
            <div className="plot-card__image" aria-hidden="true">
              {card.rank ? <span className="rank-badge">{card.rank}</span> : null}
              {card.name.slice(0, 1)}
            </div>
            <strong>{card.name}</strong>
            <span>{card.tag}</span>
            <p>{card.desc}</p>
            <button onClick={onLoginRequired}>대화 시작</button>
          </article>
        ))}
      </section>
      <BottomNav />
    </main>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18 8.8a6 6 0 0 0-12 0v3.5c0 .9-.3 1.7-.9 2.3L4 15.8h16l-1.1-1.2c-.6-.6-.9-1.4-.9-2.3V8.8ZM9.7 19a2.5 2.5 0 0 0 4.6 0" />
    </svg>
  )
}
