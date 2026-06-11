import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { formatBirthdateForDisplay, profileService } from '../db/profileService'
import type { AccountData, DialogueMode } from '../db/profileService'

type ChatMode = DialogueMode

const providerLabels: Record<string, string> = {
  kakao: '카카오',
  google: '구글',
  apple: '애플',
}

export default function AccountSettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mode, setMode] = useState<ChatMode>('unlimited')
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [toast, setToast] = useState('')
  const [withdrawSheetOpen, setWithdrawSheetOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const profile = useMemo(() => ({
    birthdate: formatBirthdateForDisplay(accountData?.profile.birthdate) || user?.birthdate || '1983.06.24',
    gender: user?.gender ?? '남성',
    email: accountData?.profile.email ?? user?.email ?? (user?.username.includes('@') ? user.username : `${user?.username ?? 'deccatree3'}@gmail.com`),
    provider: accountData?.profile.provider ?? user?.provider ?? 'kakao',
  }), [accountData, user])

  useEffect(() => {
    let mounted = true
    if (!user) return undefined

    profileService.getAccountData(user).then((data) => {
      if (!mounted) return
      setAccountData(data)
      setMode(data.settings.dialogueMode)
    })

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selectMode = (nextMode: ChatMode) => {
    setMode(nextMode)
    if (user) void profileService.updateSettings(user.id, { dialogueMode: nextMode })
    if (nextMode === 'safe') setToast('세이프 모드로 변경했어요.')
  }

  const openDeleteConfirm = () => {
    setWithdrawSheetOpen(false)
    setDeleteConfirmOpen(true)
  }

  const deleteAllChats = () => {
    setDeleteConfirmOpen(false)
    navigate('/rooms', { state: { toast: '모든 대화를 삭제했어요' } })
  }

  return (
    <main className="page settings-page account-page">
      <header className="settings-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>계정 설정</h1>
        <span />
      </header>

      {toast && (
        <div className="account-toast" role="status">
          <span aria-hidden="true">✓</span>
          <strong>{toast}</strong>
        </div>
      )}

      <section className="account-section">
        <h2>내 정보</h2>
        <div className="account-card account-info">
          <dl>
            <div>
              <dt>생년월일</dt>
              <dd>{profile.birthdate}</dd>
            </div>
            <div>
              <dt>성별</dt>
              <dd>{profile.gender}</dd>
            </div>
          </dl>
          <p>이 정보를 바탕으로 플롯을 추천해드릴게요. 대화에는 영향을 끼치지 않으며, 다른 유저는 이 정보를 볼 수 없어요.</p>
        </div>
      </section>

      <section className="account-section">
        <h2>대화 모드</h2>
        <div className="mode-options" role="radiogroup" aria-label="대화 모드">
          <button className={mode === 'safe' ? 'mode-card mode-card--active' : 'mode-card'} onClick={() => selectMode('safe')} role="radio" aria-checked={mode === 'safe'}>
            <strong>세이프</strong>
            <small>기본적인 대화</small>
          </button>
          <button className={mode === 'unlimited' ? 'mode-card mode-card--active' : 'mode-card'} onClick={() => selectMode('unlimited')} role="radio" aria-checked={mode === 'unlimited'}>
            <strong><i aria-hidden="true">✹</i> 언리밋</strong>
            <small>더 자유로운 대화</small>
          </button>
        </div>
        {mode === 'unlimited' && <p className="mode-help">언리밋이 허용되어있는 콘텐츠를 찾아보세요 <button>더 알아보기</button></p>}
      </section>

      <section className="account-section">
        <h2>로그인 정보</h2>
        <div className="account-card login-card">
          <strong>{providerLabels[profile.provider]} 계정으로 연동됨</strong>
          <span>{profile.email}</span>
        </div>
        <button className="account-withdraw" onClick={() => setWithdrawSheetOpen(true)}>
          <strong>탈퇴하기</strong>
          <b aria-hidden="true">›</b>
        </button>
      </section>

      {withdrawSheetOpen && (
        <div className="account-overlay" role="presentation" onClick={() => setWithdrawSheetOpen(false)}>
          <section className="account-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="withdraw-title" onClick={(event) => event.stopPropagation()}>
            <i aria-hidden="true" />
            <h2 id="withdraw-title">탈퇴하지 않아도<br />모든 대화를 삭제할 수 있어요</h2>
            <p>대화 내용을 남기고 싶지 않아서 탈퇴하는 거라면 깨끗하게 지워드릴게요</p>
            <button className="account-danger-primary" onClick={openDeleteConfirm}>모든 대화 삭제</button>
            <button className="account-danger-secondary" onClick={() => navigate('/withdrawal')}>탈퇴</button>
          </section>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="account-overlay account-overlay--center" role="presentation">
          <section className="account-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title">
            <h2 id="delete-chat-title">정말 모든 대화를 삭제하시겠어요?</h2>
            <p>대화방의 모든 내용이<br />삭제되며 복구할 수 없어요.</p>
            <div>
              <button onClick={() => {
                setDeleteConfirmOpen(false)
                setWithdrawSheetOpen(true)
              }}>취소</button>
              <button onClick={deleteAllChats}>삭제</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
