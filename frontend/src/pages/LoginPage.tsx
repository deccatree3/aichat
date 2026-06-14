import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { Provider } from '../auth/AuthContext'
import { heroPreviews } from '../data/heroPreviews'
import SocialButton from '../components/SocialButton'
import { AppleIcon, GoogleIcon, KakaoIcon } from '../components/BrandIcons'
import hero from '../assets/hero.png'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIdx((current) => (current + 1) % heroPreviews.length), 3800)
    return () => clearInterval(timer)
  }, [])

  const signIn = (provider: Provider) => {
    void login(provider)
    if (!import.meta.env.VITE_SUPABASE_URL) navigate('/my-page', { replace: true })
  }

  const preview = heroPreviews[idx]

  return (
    <main className="login-page">
      <section className="login-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.75)), url(${hero})` }}>
        <div className="brand">aichat</div>
        <h1>다양한 AI 플롯으로<br />나만의 스토리를 만들어보세요</h1>
        <div className="story-preview" key={idx}>
          <div className="story-preview__name">{preview.name}</div>
          {preview.messages.map((message, index) => (
            <p key={index} className={`bubble bubble--${message.type}`}>{message.text}</p>
          ))}
        </div>
      </section>
      <section className="login-actions">
        <SocialButton icon={<KakaoIcon />} label="카카오 계정으로 계속하기" onClick={() => signIn('kakao')} />
        <SocialButton icon={<GoogleIcon />} label="Google 계정으로 계속하기" onClick={() => signIn('google')} />
        <SocialButton variant="light" icon={<AppleIcon />} label="Apple로 계속하기" onClick={() => signIn('apple')} />
      </section>
    </main>
  )
}
