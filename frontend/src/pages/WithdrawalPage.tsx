import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const reasons = ['계정 초기화', '개인 정보', '플롯/대화의 문제', '기타']

export default function WithdrawalPage() {
  const navigate = useNavigate()
  const { withdrawAccount } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [firstConfirmOpen, setFirstConfirmOpen] = useState(false)
  const [finalConfirm, setFinalConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const canWithdraw = Boolean(reason && detail.trim())

  const toggleSelect = () => {
    textareaRef.current?.blur()
    setOpen((value) => !value)
  }

  const confirmWithdrawal = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await withdrawAccount({ reason, detail })
      navigate('/', { replace: true, state: { toast: '탈퇴가 완료되었습니다.' } })
    } catch (error) {
      setError(error instanceof Error ? error.message : '탈퇴 처리에 실패했습니다.')
      setSubmitting(false)
    }
  }

  const pageClassName = [
    'page',
    'settings-page',
    'withdrawal-page',
    open ? 'withdrawal-page--select-open' : '',
    finalConfirm ? 'withdrawal-page--final' : '',
  ].filter(Boolean).join(' ')

  return (
    <main className={pageClassName}>
      <header className="settings-header">
        <button onClick={() => finalConfirm ? setFinalConfirm(false) : navigate(-1)} aria-label="뒤로">‹</button>
        <h1>계정 설정</h1>
        <span />
      </header>

      {finalConfirm ? (
        <section className="withdrawal-final">
          <div className="withdrawal-warning" aria-hidden="true">!</div>
          <h2>정말 탈퇴하시겠어요?</h2>
          {error && <p role="alert">{error}</p>}
          <button className="withdrawal-final-primary" onClick={confirmWithdrawal} disabled={submitting}>{submitting ? '처리 중' : '탈퇴하기'}</button>
          <button className="withdrawal-final-secondary" onClick={() => setFinalConfirm(false)} disabled={submitting}>취소</button>
        </section>
      ) : (
        <>
          <section className="withdrawal-form">
            <h2>탈퇴하려는 이유를<br />알려주세요</h2>
            <p>적어주신 개선사항은 더 나은 서비스에 반영하겠습니다.</p>

            <div className={`withdrawal-select${open ? ' withdrawal-select--open' : ''}${reason ? ' withdrawal-select--selected' : ''}`}>
              <button onClick={toggleSelect}>
                <span>{reason || '유형을 선택해주세요'}</span>
                <b aria-hidden="true">{open ? '⌃' : '⌄'}</b>
              </button>
              {open && (
                <div className="withdrawal-menu">
                  {reasons.map((item) => (
                    <button key={item} onClick={() => {
                      setReason(item)
                      setOpen(false)
                    }}>{item}</button>
                  ))}
                </div>
              )}
            </div>

            <textarea ref={textareaRef} aria-label="탈퇴 사유 상세 입력" value={detail} onChange={(event) => setDetail(event.target.value)} onFocus={() => setOpen(false)} />
          </section>

          <button className={canWithdraw ? 'withdrawal-submit withdrawal-submit--active' : 'withdrawal-submit'} disabled={!canWithdraw} onClick={() => setFirstConfirmOpen(true)}>탈퇴하기</button>
        </>
      )}

      {firstConfirmOpen && (
        <div className="account-overlay account-overlay--center" role="presentation">
          <section className="account-confirm" role="dialog" aria-modal="true" aria-labelledby="withdrawal-first-confirm-title">
            <h2 id="withdrawal-first-confirm-title">정말 탈퇴하시겠어요?</h2>
            <div>
              <button onClick={() => setFirstConfirmOpen(false)}>취소</button>
              <button onClick={() => {
                setFirstConfirmOpen(false)
                setFinalConfirm(true)
              }}>탈퇴</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
