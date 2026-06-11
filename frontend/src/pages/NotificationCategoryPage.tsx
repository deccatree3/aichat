import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { notificationService } from '../db/notificationService'

interface NotificationRow {
  key: string
  title: string
  description?: string
}

interface NotificationCategory {
  title: string
  rows: NotificationRow[]
}

const categories: Record<string, NotificationCategory> = {
  social: {
    title: '소셜',
    rows: [
      { key: 'newFollower', title: '새 팔로워', description: '새 팔로워가 생긴 경우 알림' },
      { key: 'launch', title: '신작 출시', description: '팔로우한 크리에이터가 신작을 출시한 경우 알림' },
    ],
  },
  chat: {
    title: '대화',
    rows: [
      { key: 'favoritePlot', title: '익숙한 플롯의 답변' },
      { key: 'newPlot', title: '새로운 플롯의 답변' },
    ],
  },
  creation: {
    title: '제작',
    rows: [
      { key: 'review', title: '언리밋 심사', description: '언리밋 심사 결과 알림' },
      { key: 'visibility', title: '노출 상태 변경 안내', description: '노출이 제한됐거나, 다시 정상적으로 노출되면 알림' },
    ],
  },
  others: {
    title: '기타',
    rows: [
      { key: 'quiz', title: '퀴즈', description: '퀴즈 결과 공개 알림' },
    ],
  },
}

export default function NotificationCategoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { category } = useParams()
  const config = category ? categories[category as keyof typeof categories] : undefined
  const initialState = useMemo(() => Object.fromEntries((config?.rows ?? []).map((row) => [row.key, true])), [config])
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initialState)

  useEffect(() => {
    let mounted = true
    if (!user || !category || !config) return undefined

    notificationService.list(user.id, category, initialState).then((preferences) => {
      if (mounted) setEnabled(preferences)
    })

    return () => {
      mounted = false
    }
  }, [category, config, initialState, user])

  const toggleRow = (key: string) => {
    setEnabled((state) => {
      const nextValue = !state[key]
      if (user && category) void notificationService.set(user.id, category, key, nextValue)
      return { ...state, [key]: nextValue }
    })
  }

  if (!config) return <Navigate to="/settings/notification" replace />

  return (
    <main className="page settings-page">
      <header className="settings-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>{config.title}</h1>
        <span />
      </header>

      <section className="settings-list">
        {config.rows.map((row) => (
          <button className="settings-row" key={row.key} onClick={() => toggleRow(row.key)}>
            <span>
              <strong>{row.title}</strong>
              {row.description && <small>{row.description}</small>}
            </span>
            <i className={enabled[row.key] ? 'switch switch--on' : 'switch'} aria-hidden="true" />
          </button>
        ))}
      </section>
    </main>
  )
}
