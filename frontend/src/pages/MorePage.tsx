import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

interface Props {
  onLoginRequired: () => void
}

interface RowItem {
  label: string
  subtitle?: string
  action?: 'login' | 'logout'
  to?: string
  toggleKey?: 'chatBackground'
}

interface Section {
  title: string
  items: RowItem[]
}

const guestSections: Section[] = [
  {
    title: '고객센터',
    items: [
      { label: '공지사항', to: '/announcements' },
      { label: '고객센터', to: '/customer-center' },
    ],
  },
]

const authSections: Section[] = [
  {
    title: '고객센터',
    items: [
      { label: '공지사항', to: '/announcements' },
      { label: '고객센터', to: '/customer-center' },
    ],
  },
  {
    title: '알림 · 마케팅',
    items: [
      { label: '알림 설정', to: '/settings/notification' },
    ],
  },
  {
    title: '내 계정 관리',
    items: [
      { label: '계정 설정', to: '/settings/account' },
    ],
  },
  {
    title: '대화 화면 설정',
    items: [
      { label: '배경 이미지', subtitle: '모든 대화 화면에 적용돼요', toggleKey: 'chatBackground' },
    ],
  },
  {
    title: '차단 관리',
    items: [
      { label: '차단한 크리에이터', to: '/blocked-creators' },
      { label: '차단한 플롯', to: '/blocked-plots' },
      { label: '차단한 해시태그', to: '/blocked-hashtags' },
    ],
  },
  {
    title: '결제수단',
    items: [
      { label: '제타페이 관리' },
    ],
  },
  {
    title: 'Nutty',
    items: [
      { label: 'Nutty 설정' },
    ],
  },
  {
    title: '',
    items: [
      { label: '로그아웃', action: 'logout' },
    ],
  },
]

export default function MorePage({ onLoginRequired }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const sections = user ? authSections : guestSections
  const [toggles, setToggles] = useState({ chatBackground: false })

  const handleItem = (item: RowItem) => {
    if (item.toggleKey) {
      const key = item.toggleKey
      setToggles((state) => ({ ...state, [key]: !state[key] }))
    } else if (item.to) navigate(item.to)
    else if (item.action === 'logout') void logout()
    else if (item.action === 'login') onLoginRequired()
  }

  return (
    <main className="page more-page">
      <header className="more-header">
        <button className="more-header__back" onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>더보기</h1>
        <span />
      </header>

      <div className="more-sections">
        {sections.map((section, sectionIndex) => (
          <section className={section.title ? 'more-section' : 'more-section more-section--plain'} key={`${section.title}-${sectionIndex}`}>
            {section.title && <h2>{section.title}</h2>}
            <div className="more-section__items">
              {section.items.map((item) => (
                <button className={item.action === 'logout' ? 'more-row more-row--muted' : 'more-row'} key={item.label} onClick={() => handleItem(item)}>
                  <span>
                    <strong>{item.label}</strong>
                    {item.subtitle && <small>{item.subtitle}</small>}
                  </span>
                  {item.toggleKey ? <i className={toggles[item.toggleKey] ? 'switch switch--on' : 'switch'} aria-hidden="true" /> : item.action === 'logout' ? null : <b>›</b>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
