import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { blockService } from '../db/blockService'
import type { BlockTargetType, UserBlock } from '../db/blockService'
import { reportService } from '../db/reportService'

type BlockedKind = 'creators' | 'plots' | 'hashtags'

interface Props {
  kind: BlockedKind
}

const pageCopy = {
  creators: {
    title: '차단한 크리에이터',
    section: '차단한 크리에이터',
    targetType: 'creator',
    empty: '차단한 크리에이터가 없습니다.',
  },
  plots: {
    title: '차단한 플롯',
    section: '차단한 플롯',
    targetType: 'plot',
    empty: '차단한 플롯이 없습니다.',
  },
  hashtags: {
    title: '차단한 해시태그',
    section: '차단한 해시태그',
    targetType: 'hashtag',
    empty: '차단한 해시태그가 없습니다.',
  },
} satisfies Record<BlockedKind, { title: string; section: string; targetType: BlockTargetType; empty: string }>

const reportReasons = ['선정성', '혐오/차별', '폭력 및 위협', '스팸', '거짓 정보', '개인정보 침해', '저작권 침해', '기타']

export default function BlockedItemsPage({ kind }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const copy = pageCopy[kind]
  const [blocks, setBlocks] = useState<UserBlock[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedBlock, setSelectedBlock] = useState<UserBlock | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [toast, setToast] = useState('')

  const reportSubmitEnabled = useMemo(() => {
    return Boolean(reportReason) && (reportReason !== '기타' || Boolean(reportDetail.trim()))
  }, [reportDetail, reportReason])

  useEffect(() => {
    let mounted = true
    if (!user) return undefined

    blockService.list(user.id, copy.targetType).then((items) => {
      if (mounted) setBlocks(items)
    })

    return () => {
      mounted = false
    }
  }, [copy.targetType, user])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const addHashtags = (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    const nextTags = tagInput
      .split(',')
      .map((tag) => tag.trim().replace(/^#+/, ''))
      .filter(Boolean)

    if (!nextTags.length) return

    nextTags.forEach((tag) => {
      void blockService.create(user.id, 'hashtag', tag, tag).then(() => {
        setBlocks((items) => (
          items.some((item) => item.targetId === tag)
            ? items
            : [{ id: tag, targetType: 'hashtag', targetId: tag, targetLabel: tag }, ...items]
        ))
      })
    })
    setTagInput('')
  }

  const removeBlock = (block: UserBlock) => {
    void blockService.remove(block.id)
    setBlocks((items) => items.filter((item) => item.id !== block.id))
  }

  const openReport = (block: UserBlock) => {
    setSelectedBlock(block)
    setReportReason('')
    setReportDetail('')
    setReportOpen(true)
  }

  const submitReport = () => {
    if (!user || !selectedBlock || !reportSubmitEnabled) return

    void reportService
      .create({
        reporterMid: user.id,
        targetType: selectedBlock.targetType,
        targetId: selectedBlock.targetId,
        targetLabel: selectedBlock.targetLabel,
        reason: reportReason,
        detail: reportDetail.trim(),
      })
      .then(() => {
        setReportOpen(false)
        setToast('신고가 접수됐어요')
      })
      .catch(() => {
        setToast('신고 접수에 실패했어요')
      })
  }

  return (
    <main className="page settings-page blocked-page">
      {toast && (
        <div className="chat-toast" role="status">
          <span aria-hidden="true">✓</span>
          <strong>{toast}</strong>
        </div>
      )}
      <header className="settings-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">←</button>
        <h1>{copy.title}</h1>
        <span />
      </header>

      <section className="blocked-section">
        <h2>{copy.section}</h2>

        {kind === 'hashtags' && (
          <form className="blocked-hashtag-form" onSubmit={addHashtags}>
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="해시태그를 쉼표(,)로 구분해서 추가하세요"
              aria-label="차단할 해시태그"
            />
            <button type="submit">추가</button>
          </form>
        )}

        {blocks.length === 0 ? (
          <p className="notice-state">{copy.empty}</p>
        ) : (
          <div className={kind === 'hashtags' ? 'blocked-tag-list' : 'blocked-list'}>
            {blocks.map((block) => (
              kind === 'hashtags' ? (
                <div className="blocked-tag-row" key={block.id}>
                  <strong>#{block.targetLabel}</strong>
                  <button onClick={() => removeBlock(block)} aria-label={`${block.targetLabel} 해시태그 해제`}>
                    ×
                  </button>
                </div>
              ) : (
                <div className="blocked-row" key={block.id}>
                  <span className="blocked-avatar blocked-avatar--blue" aria-hidden="true">
                    {block.targetLabel.slice(0, 1)}
                  </span>
                  <span className="blocked-copy">
                    <strong>{block.targetLabel}</strong>
                    <span>{block.targetId}</span>
                  </span>
                  <button className="blocked-unblock" onClick={() => openReport(block)}>신고</button>
                  <button className="blocked-unblock" onClick={() => removeBlock(block)}>차단 해제</button>
                </div>
              )
            ))}
          </div>
        )}
      </section>

      {reportOpen && selectedBlock && (
        <div className="creator-report-backdrop" onClick={() => setReportOpen(false)}>
          <section className="creator-report-sheet" onClick={(event) => event.stopPropagation()} aria-label="신고">
            <header>
              <button onClick={() => setReportOpen(false)} aria-label="닫기">×</button>
              <h2>신고</h2>
              <button className={reportSubmitEnabled ? 'is-active' : ''} onClick={submitReport}>제출</button>
            </header>
            <div className="creator-report-body">
              <h3>{selectedBlock.targetLabel} 신고 사유를 선택하세요</h3>
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
              {reportReason === '기타' && (
                <input
                  value={reportDetail}
                  onChange={(event) => setReportDetail(event.target.value)}
                  placeholder="신고 사유를 입력하세요"
                  autoFocus
                />
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
