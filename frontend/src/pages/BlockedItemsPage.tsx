import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { blockService } from '../db/blockService'

type BlockedKind = 'creators' | 'plots' | 'hashtags'
type PlotSort = 'chat' | 'newest' | 'updated' | 'oldest'

interface Props {
  kind: BlockedKind
}

interface BlockedEntry {
  id: string
  title: string
  subtitle?: string
  accent: string
  profileName?: string
  following?: number
  followers?: number
  plotSummary?: string
}

const initialCreators: BlockedEntry[] = [
  { id: 'tan', title: '탄', subtitle: '@TAN_0122', accent: 'blocked-avatar--pink', followers: 1280, plotSummary: '12개의 플롯 · 대화량 38만' },
  { id: 'runnycage3661', title: 'RunnyCage3661', subtitle: '@RunnyCage3661', accent: 'blocked-avatar--gold', followers: 2480, plotSummary: '21개의 플롯 · 대화량 72만' },
  { id: 'xesxex', title: 'X', subtitle: '@Xesxex', accent: 'blocked-avatar--x', profileName: 'Xesxex', following: 0, followers: 4240, plotSummary: '38개의 플롯 · 대화량 1,550만' },
]

const initialPlots: BlockedEntry[] = [
  { id: 'plot-1', title: '공하결', accent: 'blocked-avatar--blue' },
  { id: 'plot-2', title: '좀비사태의 청련고등학교 선생님들', accent: 'blocked-avatar--green' },
]

const pageCopy = {
  creators: {
    title: '차단한 크리에이터',
    section: '차단한 크리에이터',
  },
  plots: {
    title: '차단한 플롯',
    section: '차단한 플롯',
  },
  hashtags: {
    title: '차단한 해시태그',
    section: '차단한 해시태그',
  },
}

const reportReasons = ['선정성', '혐오스러운 콘텐츠', '폭력 및 욕설', '스팸', '거짓 정보', '개인정보 침해', '특정 집단 혐오', '지적재산권 침해', '자살 또는 자해', '기타']
const guidedReportReasons = ['개인정보 침해', '지적재산권 침해']
const plotSortLabels: Record<PlotSort, string> = {
  chat: '대화량순',
  newest: '최신순',
  updated: '업데이트순',
  oldest: '오래된순',
}

export default function BlockedItemsPage({ kind }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const copy = pageCopy[kind]
  const [creators, setCreators] = useState(initialCreators)
  const [plots, setPlots] = useState(initialPlots)
  const [hashtags, setHashtags] = useState(['고어', '공포', '외계인'])
  const [hashtagBlockIds, setHashtagBlockIds] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')
  const [selectedCreator, setSelectedCreator] = useState<BlockedEntry | null>(null)
  const [unblockedCreatorIds, setUnblockedCreatorIds] = useState<string[]>([])
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [toast, setToast] = useState('')
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [plotSort, setPlotSort] = useState<PlotSort>('chat')
  const [plotSortOpen, setPlotSortOpen] = useState(false)

  const entries = useMemo(() => (kind === 'creators' ? creators : plots), [creators, kind, plots])
  const sortedCreatorPlotCards = useMemo(() => {
    const cards = [...creatorPlotCards]
    if (plotSort === 'chat') return cards.sort((a, b) => b.chatScore - a.chatScore)
    if (plotSort === 'newest') return cards.sort((a, b) => b.createdAt - a.createdAt)
    if (plotSort === 'updated') return cards.sort((a, b) => b.updatedAt - a.updatedAt)
    return cards.sort((a, b) => a.createdAt - b.createdAt)
  }, [plotSort])
  const selectedCreatorBlocked = selectedCreator ? !unblockedCreatorIds.includes(selectedCreator.id) : false
  const reportNeedsGuide = guidedReportReasons.includes(reportReason)
  const reportSubmitEnabled = Boolean(reportReason) && !reportNeedsGuide && (reportReason !== '기타' || Boolean(reportDetail.trim()))

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let mounted = true
    if (!user || kind !== 'hashtags') return undefined

    blockService.list(user.id, 'hashtag').then((blocks) => {
      if (!mounted || !blocks.length) return
      setHashtags(blocks.map((block) => block.targetLabel))
      setHashtagBlockIds(Object.fromEntries(blocks.map((block) => [block.targetLabel, block.id])))
    })

    return () => {
      mounted = false
    }
  }, [kind, user])

  const unblock = (id: string) => {
    if (kind === 'creators') setCreators((items) => items.filter((item) => item.id !== id))
    if (kind === 'plots') setPlots((items) => items.filter((item) => item.id !== id))
  }

  const addHashtags = (event: FormEvent) => {
    event.preventDefault()
    const nextTags = tagInput
      .split(',')
      .map((tag) => tag.trim().replace(/^#+/, ''))
      .filter(Boolean)

    if (!nextTags.length) return

    setHashtags((items) => Array.from(new Set([...items, ...nextTags])))
    if (user) {
      nextTags.forEach((tag) => {
        void blockService.create(user.id, 'hashtag', tag, tag)
      })
    }
    setTagInput('')
  }

  const removeHashtag = (tag: string) => {
    const blockId = hashtagBlockIds[tag]
    if (blockId) void blockService.remove(blockId)
    setHashtags((items) => items.filter((item) => item !== tag))
    setHashtagBlockIds((ids) => {
      const nextIds = { ...ids }
      delete nextIds[tag]
      return nextIds
    })
  }

  const unblockSelectedCreator = () => {
    if (!selectedCreator) return
    setUnblockedCreatorIds((ids) => [...ids, selectedCreator.id])
    setCreators((items) => items.filter((item) => item.id !== selectedCreator.id))
  }

  const blockSelectedCreator = () => {
    if (!selectedCreator) return
    setUnblockedCreatorIds((ids) => ids.filter((id) => id !== selectedCreator.id))
    setCreators((items) => (items.some((item) => item.id === selectedCreator.id) ? items : [...items, selectedCreator]))
    setBlockConfirmOpen(false)
    setProfileMenuOpen(false)
  }

  const openReport = () => {
    setProfileMenuOpen(false)
    setReportReason('')
    setReportDetail('')
    setReportOpen(true)
  }

  const submitReport = () => {
    if (!reportSubmitEnabled) return
    setReportOpen(false)
    setToast('신고가 접수되었어요')
  }

  if (selectedCreator) {
    return (
      <main className="page settings-page creator-profile-page">
        {toast && (
          <div className="chat-toast" role="status">
            <span aria-hidden="true">✓</span>
            <strong>{toast}</strong>
          </div>
        )}
        <header className="settings-header creator-profile-header">
          <button onClick={() => setSelectedCreator(null)} aria-label="뒤로">‹</button>
          <h1>{selectedCreator.profileName ?? selectedCreator.title}</h1>
          <button aria-label="더보기" className="creator-profile-more" onClick={() => setProfileMenuOpen((open) => !open)}>⋮</button>
          {profileMenuOpen && (
            <div className="creator-profile-menu">
              <button onClick={openReport}>크리에이터 신고</button>
              <button onClick={() => {
                setProfileMenuOpen(false)
                setBlockConfirmOpen(true)
              }}>크리에이터 차단</button>
            </div>
          )}
        </header>

        <section className="creator-profile-head">
          <div className={`blocked-avatar creator-profile-avatar ${selectedCreator.accent}`} aria-hidden="true">
            {selectedCreator.title.slice(0, 1)}
          </div>
          <div>
            <strong>{selectedCreator.title}</strong>
            <span>{selectedCreator.subtitle}</span>
          </div>
        </section>

        <div className="creator-profile-stats">
          <strong>{selectedCreator.following ?? 0}</strong><span>팔로잉</span>
          <strong>{selectedCreator.followers ?? 0}</strong><span>팔로워</span>
        </div>

        <div className="creator-profile-actions">
          <button>프로필 공유</button>
          {selectedCreatorBlocked ? (
            <button className="creator-profile-primary" onClick={unblockSelectedCreator}>차단 해제</button>
          ) : (
            <button className="creator-profile-primary">팔로우</button>
          )}
        </div>

        <section className="creator-plots">
          <div className="creator-plots-head">
            <div>
              <h2>플롯</h2>
              <p>{selectedCreator.plotSummary}</p>
            </div>
            <div className="creator-plot-sort">
              <button onClick={() => setPlotSortOpen((open) => !open)}>
                {plotSortLabels[plotSort]} <span>{plotSortOpen ? '⌃' : '⌄'}</span>
              </button>
              {plotSortOpen && (
                <div className="creator-plot-sort-menu">
                  {(Object.keys(plotSortLabels) as PlotSort[]).map((sort) => (
                    <button
                      key={sort}
                      className={plotSort === sort ? 'is-selected' : ''}
                      onClick={() => {
                        setPlotSort(sort)
                        setPlotSortOpen(false)
                      }}
                    >
                      {plotSortLabels[sort]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedCreatorBlocked ? (
            <p className="creator-plots-empty">플롯을 확인할 수 없어요</p>
          ) : (
            <div className="creator-plot-grid">
              {sortedCreatorPlotCards.map((plot) => (
                <article className="creator-plot-card" key={plot.name}>
                  <div className={`creator-plot-image ${plot.accent}`}>
                    <span>{plot.count}</span>
                  </div>
                  <strong>{plot.name}</strong>
                  <p>{plot.desc}</p>
                  <small>{plot.tags}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        {reportOpen && (
          <div className="creator-report-backdrop" onClick={() => setReportOpen(false)}>
            <section className="creator-report-sheet" onClick={(event) => event.stopPropagation()} aria-label="크리에이터 신고">
              <header>
                <button onClick={() => setReportOpen(false)} aria-label="닫기">×</button>
                <h2>크리에이터 신고</h2>
                <button className={reportSubmitEnabled ? 'is-active' : ''} onClick={submitReport}>제출</button>
              </header>
              <div className="creator-report-body">
                <h3>{reportReason === '기타' ? '기타 이유를 입력해주세요' : '크리에이터를 신고하시려는 이유를 선택해주세요'}</h3>
                {reportReason !== '기타' && <p>신고해주신 내용을 최대한 빠르게 반영할게요</p>}
                {reportReason !== '기타' && (
                  <div className="creator-report-reasons">
                    {reportReasons.map((reason) => (
                      <button
                        key={reason}
                        className={reportReason === reason ? 'is-selected' : ''}
                        onClick={() => setReportReason(reason)}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                )}
                {reportReason === '기타' && (
                  <input
                    value={reportDetail}
                    onChange={(event) => setReportDetail(event.target.value)}
                    placeholder="신고 이유를 입력해주세요"
                    autoFocus
                  />
                )}
                {reportNeedsGuide && (
                  <p className="creator-report-guide">
                    ⓘ 나의 저작권이나 초상권 등 권리가 침해되고 있는 사실을 발견하신 경우, 침해 내용을 캡처 등으로 기록한 다음 고객센터를 통해 신고해주세요. 신속하게 조치하겠습니다.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {blockConfirmOpen && (
          <div className="creator-block-confirm-backdrop" onClick={() => setBlockConfirmOpen(false)}>
            <section className="creator-block-confirm" onClick={(event) => event.stopPropagation()} aria-label="크리에이터 차단 확인">
              <h2>{selectedCreator.title}님을 차단할까요?</h2>
              <p>차단한 크리에이터의 플롯은 보이지 않아요</p>
              <div>
                <button onClick={() => setBlockConfirmOpen(false)}>취소</button>
                <button onClick={blockSelectedCreator}>차단</button>
              </div>
            </section>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="page settings-page blocked-page">
      <header className="settings-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>{copy.title}</h1>
        <span />
      </header>

      <section className="blocked-section">
        <h2>{copy.section}</h2>

        {kind === 'hashtags' ? (
          <>
            <form className="blocked-hashtag-form" onSubmit={addHashtags}>
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="해시태그를 쉼표(,)로 구분해서 추가하세요"
                aria-label="차단할 해시태그"
              />
              <button type="submit">추가</button>
            </form>

            <div className="blocked-tag-list">
              {hashtags.map((tag) => (
                <div className="blocked-tag-row" key={tag}>
                  <strong>#{tag}</strong>
                  <button onClick={() => removeHashtag(tag)} aria-label={`${tag} 해시태그 삭제`}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="blocked-list">
            {entries.map((entry) => (
              <button
                className="blocked-row"
                key={entry.id}
                onClick={() => (kind === 'creators' ? setSelectedCreator(entry) : undefined)}
              >
                <span className={`blocked-avatar ${entry.accent}`} aria-hidden="true">
                  {entry.title.slice(0, 1)}
                </span>
                <span className="blocked-copy">
                  <strong>{entry.title}</strong>
                  {entry.subtitle && <span>{entry.subtitle}</span>}
                </span>
                <span className="blocked-unblock" onClick={(event) => {
                  event.stopPropagation()
                  unblock(entry.id)
                }}>차단 해제</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

const creatorPlotCards = [
  { name: '서이현', count: '420만', chatScore: 420, createdAt: 20260601, updatedAt: 20260609, desc: '10년을 넘게 함께했지만 지나치게 무뚝뚝한 여자친구', tags: '#여사친 #대학생 #엄살딸 #예쁨 #존예 #', accent: 'creator-plot-image--school' },
  { name: '윤하린', count: '181만', chatScore: 181, createdAt: 20260528, updatedAt: 20260610, desc: '유명 일진 아재의 끝을 무서버린 조그만 별생이.', tags: '#로맨스 #비밀전학생교 #학원물 #예쁨', accent: 'creator-plot-image--gray' },
  { name: '김아린', count: '163만', chatScore: 163, createdAt: 20260512, updatedAt: 20260605, desc: '괴..괴롭히지좀 마..!', tags: '#로맨스 #부부 #여자 #예쁨 #귀여움 #아', accent: 'creator-plot-image--white' },
  { name: '이서린', count: '152만', chatScore: 152, createdAt: 20260430, updatedAt: 20260603, desc: '배신자로 몰리고, 모시던 보스의 손에 죽을 위기에 처했다.', tags: '#느와르 #조직 #조직보스 #여자 #예쁨 #', accent: 'creator-plot-image--black' },
  { name: '하유나', count: '119만', chatScore: 119, createdAt: 20260608, updatedAt: 20260608, desc: '조용한 방 안에서 시작되는 위험한 대화.', tags: '#로맨스 #비밀 #여자 #긴장감', accent: 'creator-plot-image--white' },
  { name: '차세라', count: '98.6만', chatScore: 98.6, createdAt: 20260502, updatedAt: 20260520, desc: '모두가 숨기는 진실을 알고 있는 여자.', tags: '#미스터리 #로맨스 #집착', accent: 'creator-plot-image--gray' },
]
