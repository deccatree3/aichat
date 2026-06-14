import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../auth/authService'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function complete() {
      try {
        await authService.completeCallback()
        navigate('/signup', { replace: true })
      } catch (error) {
        setError(error instanceof Error ? error.message : '로그인 처리에 실패했습니다.')
      }
    }
    void complete()
  }, [navigate])

  return (
    <main className="page auth-callback">
      <strong>{error ? '로그인 실패' : '로그인 처리 중'}</strong>
      <p>{error ?? '잠시만 기다려주세요.'}</p>
    </main>
  )
}
