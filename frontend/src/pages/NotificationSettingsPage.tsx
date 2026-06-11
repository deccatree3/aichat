import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { profileService } from '../db/profileService'

const serviceRows = [
  { title: '소셜', description: '새 팔로워, 팔로우한 크리에터의 소식 알림', to: '/settings/notification/social' },
  { title: '대화', description: '대화와 관련된 알림', to: '/settings/notification/chat' },
  { title: '제작', description: '내 제작 활동과 관련된 알림', to: '/settings/notification/creation' },
  { title: '기타', description: '퀴즈 알림', to: '/settings/notification/others' },
]

export default function NotificationSettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!user) return undefined

    profileService.getAccountData(user).then((data) => {
      if (mounted) setMarketing(data.settings.marketingOptIn)
    })

    return () => {
      mounted = false
    }
  }, [user])

  const toggleMarketing = () => {
    setMarketing((value) => {
      const nextValue = !value
      if (user) void profileService.updateSettings(user.id, { marketingOptIn: nextValue })
      return nextValue
    })
  }

  return (
    <main className="page settings-page">
      <header className="settings-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>알림 설정</h1>
        <span />
      </header>

      <section className="settings-section">
        <h2>서비스별 알림 설정</h2>
        <div className="settings-list">
          {serviceRows.map((row) => (
            <button className="settings-row" key={row.title} onClick={() => navigate(row.to)}>
              <span>
                <strong>{row.title}</strong>
                <small>{row.description}</small>
              </span>
              <b aria-hidden="true">›</b>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>혜택 및 마케팅</h2>
        <button className="settings-row" onClick={toggleMarketing}>
          <span>
            <strong>혜택 · 마케팅 정보 수신 동의</strong>
            <small>인기 콘텐츠 및 혜택 안내</small>
          </span>
          <i className={marketing ? 'switch switch--on' : 'switch'} aria-hidden="true" />
        </button>
      </section>
    </main>
  )
}
