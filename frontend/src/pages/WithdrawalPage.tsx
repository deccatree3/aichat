import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const reasons = ['계정 초기화', '개인 정보', '플롯/대화의 재미', '기타']

export default function WithdrawalPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [firstConfirmOpen, setFirstConfirmOpen] = useState(false)
  const [finalConfirm, setFinalConfirm] = useState(false)
  const canWithdraw = Boolean(reason && detail.trim())
  const toggleSelect = () => {
    textareaRef.current?.blur()
    setOpen((value) => !value)
  }
  const confirmWithdrawal = async () => {
    await logout()
    navigate('/', { replace: true, state: { toast: '동의하기' } })
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
          <p>탈퇴 이후에는 어떠한 수단으로도 복구가 불가능해요</p>
          <button className="withdrawal-final-primary" onClick={confirmWithdrawal}>탈퇴하기</button>
          <button className="withdrawal-final-secondary" onClick={() => setFinalConfirm(false)}>취소</button>
        </section>
      ) : (
        <>
          <section className="withdrawal-form">
            <h2>탈퇴하려는 이유를<br />알려주세요</h2>
            <p>적어주시는 개선사항을 최대한 빠르게 반영할게요</p>

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
            <p>탈퇴 이후에는 어떠한 수단으로도 복구가 불가능해요.</p>
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
