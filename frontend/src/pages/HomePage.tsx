import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import BottomNav from '../components/BottomNav'
import { contentService } from '../db/contentService'
import type { PlotSummary } from '../db/contentService'

interface Props {
  mode?: 'home' | 'ranking'
  title?: string
  onLoginRequired: () => void
}

type RankingTab = 'trending' | 'best' | 'new'
type PlotCard = PlotSummary & { rank?: number }

const rankingLabels: Record<RankingTab, string> = {
  trending: '트렌딩',
  best: '베스트',
  new: '신작',
}

function plotMeta(plot: PlotSummary) {
  const tags = plot.tags.length ? plot.tags.map((tag) => `#${tag}`).join(' ') : plot.subtitle
  const chats = plot.chatCount > 0 ? `대화 ${plot.chatCount.toLocaleString()}회` : ''
  return [tags, chats].filter(Boolean).join(' · ')
}

export default function HomePage({ mode = 'home', title, onLoginRequired }: Props) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const routeToast = (location.state as { toast?: string } | null)?.toast ?? ''
  const [rankingTab, setRankingTab] = useState<RankingTab>('trending')
  const [toast, setToast] = useState(routeToast)
  const [plots, setPlots] = useState<PlotSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const request = mode === 'ranking'
      ? contentService.listRankingPlots(rankingTab)
      : contentService.listHomePlots()

    request
      .then((items) => {
        if (mounted) setPlots(items)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [mode, rankingTab])

  useEffect(() => {
    if (!toast) return undefined
    navigate(location.pathname, { replace: true, state: null })
    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [location.pathname, navigate, toast])

  const visibleCards: PlotCard[] = mode === 'ranking'
    ? plots.map((plot, index) => ({ ...plot, rank: index + 1 }))
    : plots

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
      {loading && <p className="notice-state">불러오는 중입니다.</p>}
      {!loading && visibleCards.length === 0 && (
        <section className="empty-state">
          <strong>등록된 플롯이 없습니다</strong>
          <p>공개된 플롯이 생기면 이곳에 표시됩니다.</p>
        </section>
      )}
      <section className="plot-grid" aria-label="추천 플롯">
        {visibleCards.map((plot) => (
          <article className="plot-card" key={plot.id}>
            <div className="plot-card__image" aria-hidden="true">
              {plot.rank ? <span className="rank-badge">{plot.rank}</span> : null}
              {plot.thumbnailUrl ? <img src={plot.thumbnailUrl} alt="" /> : plot.title.slice(0, 1)}
            </div>
            <strong>{plot.title}</strong>
            <span>{plotMeta(plot)}</span>
            <p>{plot.description ?? plot.subtitle ?? ''}</p>
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
