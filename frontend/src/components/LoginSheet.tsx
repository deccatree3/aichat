import { useAuth } from '../auth/AuthContext'
import type { Provider } from '../auth/AuthContext'
import SocialButton from './SocialButton'
import { AppleIcon, GoogleIcon, KakaoIcon } from './BrandIcons'

interface Props {
  open: boolean
  onClose: () => void
}

export default function LoginSheet({ open, onClose }: Props) {
  const { login } = useAuth()
  if (!open) return null

  const signIn = (provider: Provider) => {
    void login(provider)
    onClose()
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="로그인/회원가입">
      <button className="sheet__scrim" onClick={onClose} aria-label="닫기" />
      <section className="sheet__panel">
        <header className="sheet__header">
          <h2>로그인/회원가입</h2>
          <button className="sheet__close" onClick={onClose} aria-label="닫기">×</button>
        </header>
        <div className="sheet__body">
          <p className="sheet__title">로그인하고 다양한 AI 플롯을 자유롭게 즐겨보세요</p>
          <div className="sheet__actions">
            <div className="sheet__recommended">
              <span>마지막으로 이용한 로그인 수단이에요</span>
              <SocialButton icon={<KakaoIcon />} label="카카오 계정으로 계속하기" onClick={() => signIn('kakao')} />
            </div>
            <SocialButton icon={<GoogleIcon />} label="Google 계정으로 계속하기" onClick={() => signIn('google')} />
            <SocialButton variant="light" icon={<AppleIcon />} label="Apple로 계속하기" onClick={() => signIn('apple')} />
          </div>
        </div>
      </section>
    </div>
  )
}
