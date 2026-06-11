import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { noticeService } from '../notices/noticeService'

function AdminAccessState({ title, description }: { title: string; description: string }) {
  return (
    <main className="page notice-page admin-access-page">
      <section className="admin-access-card">
        <h1>{title}</h1>
        <p>{description}</p>
        <Link to="/login">로그인 화면으로 이동</Link>
      </section>
    </main>
  )
}

export default function AdminNoticeGuard({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let mounted = true

    if (!authReady || !user) return

    noticeService
      .isCurrentUserAdmin(user.id)
      .then((allowed) => {
        if (mounted) setIsAdmin(allowed)
      })
      .finally(() => {
        if (mounted) setChecked(true)
      })

    return () => {
      mounted = false
    }
  }, [authReady, user])

  if (!authReady) return <main className="page notice-page"><p className="notice-state">확인 중입니다.</p></main>
  if (!user) {
    return (
      <AdminAccessState
        title="관리자 로그인이 필요합니다"
        description="공지 관리 화면은 관리자 권한이 등록된 로그인 사용자만 접근할 수 있습니다."
      />
    )
  }
  if (!checked) return <main className="page notice-page"><p className="notice-state">확인 중입니다.</p></main>
  if (!isAdmin) {
    return (
      <AdminAccessState
        title="관리자 권한이 없습니다"
        description="현재 로그인 계정이 admin_users 테이블에 등록되어 있지 않습니다."
      />
    )
  }

  return children
}
