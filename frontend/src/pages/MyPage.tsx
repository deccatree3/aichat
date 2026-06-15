import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { Provider } from '../auth/AuthContext'
import BottomNav from '../components/BottomNav'
import SocialButton from '../components/SocialButton'
import { AppleIcon, GoogleIcon, KakaoIcon } from '../components/BrandIcons'
import { profileService } from '../db/profileService'
import type { AccountData } from '../db/profileService'

interface Props {
  onLoginRequired: () => void
}

export default function MyPage({ onLoginRequired }: Props) {
  const { user, login } = useAuth()
  const [accountData, setAccountData] = useState<AccountData | null>(null)

  useEffect(() => {
    let mounted = true
    if (!user) return undefined

    profileService.getAccountData(user).then((data) => {
      if (mounted) setAccountData(data)
    })

    return () => {
      mounted = false
    }
  }, [user])

  const signIn = (provider: Provider) => {
    void login(provider)
  }

  if (!user) {
    return (
      <main className="page with-nav mypage mypage--guest">
        <header className="topbar">
          <h1>마이페이지</h1>
          <Link className="icon-btn" to="/more" aria-label="더보기">☰</Link>
        </header>
        <section className="mypage-login">
          <div className="guest-hero__logo">aichat</div>
          <p>다양한 AI 플롯으로 나만의 스토리를 만들어보세요</p>
          <div className="mypage-login__actions sheet__actions">
            <div className="sheet__recommended">
              <span>마지막으로 이용한 로그인 수단이에요</span>
              <SocialButton icon={<KakaoIcon />} label="카카오 계정으로 계속하기" onClick={() => signIn('kakao')} />
            </div>
            <SocialButton icon={<GoogleIcon />} label="Google 계정으로 계속하기" onClick={() => signIn('google')} />
            <SocialButton variant="light" icon={<AppleIcon />} label="Apple로 계속하기" onClick={() => signIn('apple')} />
          </div>
        </section>
        <BottomNav />
      </main>
    )
  }

  const nickname = accountData?.profile.nickname ?? user.nickname ?? 'aichat 회원'
  const username = accountData?.profile.username ?? user.username ?? `member${user.mid}`
  const avatarUrl = accountData?.profile.avatarUrl
  const bio = accountData?.profile.bio ?? user.bio ?? '자기소개를 작성해보세요.'
  const pieces = accountData?.wallet.pieceBalance ?? user.pieces
  const followers = accountData?.follows.followers ?? 0
  const following = accountData?.follows.following ?? 0
  const membership = accountData?.membership
  const autoCharge = accountData?.autoCharge

  return (
    <main className="page with-nav mypage">
      <header className="topbar">
        <h1>마이페이지</h1>
        <Link className="icon-btn" to="/more" aria-label="더보기">☰</Link>
      </header>
      <section className="mypage-profile">
        <div className="mypage-profile__head">
          <div className="avatar" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <span />}
          </div>
          <div className="mypage-profile__identity">
            <strong>{nickname}</strong>
            <span>@{username}</span>
          </div>
        </div>
        <p>{bio}</p>
        <div className="mypage-profile__stats">
          <span><b>{following.toLocaleString()}</b> 팔로잉</span>
          <span><b>{followers.toLocaleString()}</b> 팔로워</span>
        </div>
        <div className="mypage-profile__actions">
          <button>프로필 공유</button>
          <Link to="/profile/edit">프로필 편집</Link>
        </div>
      </section>

      {membership?.active && (
        <section className="pass-banner">
          <strong><i aria-hidden="true">a</i> aichat 패스 이용중</strong>
          <Link to="/more">
            {membership.daysRemaining === null ? '관리하기 ›' : `${membership.daysRemaining}일 남음 · 관리하기 ›`}
          </Link>
        </section>
      )}

      <section className="wallet">
        <div className="wallet__balance">
          <div>
            <span>내 피스</span>
            <strong><i aria-hidden="true">z</i> {pieces.toLocaleString()}</strong>
          </div>
          <div className="wallet__actions">
            <Link to="/piece/history">내역</Link>
            <Link to="/piece/charge">충전</Link>
          </div>
        </div>
        <div className="wallet__auto">
          <span>자동충전</span>
          <div>
            <strong>
              <i aria-hidden="true">z</i>
              {autoCharge?.enabled ? `${autoCharge.thresholdPieces.toLocaleString()}피스 이하 자동충전` : '자동충전 꺼짐'}
            </strong>
            <button onClick={onLoginRequired}>{autoCharge?.enabled ? '관리' : '설정'}</button>
          </div>
        </div>
      </section>

      <section className="mypage-company">
        <h2>aichat</h2>
        <p>주식회사 캐처스</p>
        <p>
          서울 서초구 강남대로 341, 8층 831호<br />
          대표자명: 박은상 | 사업자등록번호: 556-81-02489<br />
          통신판매업 신고번호: 제 2022-서울서초-1505호<br />
          대표 전화: 1577-6037 | 이메일: admin@katchers.co.kr<br />
          개인정보보호책임자: 박은상
        </p>
        <nav aria-label="정책 링크">
          <Link to="/more">개인정보처리방침</Link>
          <Link to="/more">이용약관</Link>
          <Link to="/more">운영정책</Link>
          <Link to="/more">청소년보호정책</Link>
          <Link to="/customer-center">고객센터</Link>
        </nav>
      </section>
      <BottomNav />
    </main>
  )
}
