import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { pieceProducts } from '../data/pieces'
import { walletService } from '../db/walletService'

export default function PieceChargePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [balance, setBalance] = useState(user?.pieces ?? 0)

  useEffect(() => {
    let mounted = true
    if (!user) return undefined

    walletService.getBalance(user.id, user.pieces).then((nextBalance) => {
      if (mounted) setBalance(nextBalance)
    })

    return () => {
      mounted = false
    }
  }, [user])

  return (
    <main className="page piece-page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>피스충전</h1>
        <span />
      </header>
      <section className="piece-balance">
        <span className="coin">◆</span>
        <strong>내 피스 {balance}</strong>
      </section>
      <section className="promo">
        <strong>퀵계좌이체 결제 시<br />1% 무제한 즉시할인</strong>
        <span>2/2</span>
      </section>
      <section className="product-list">
        <h2>피스 충전</h2>
        <p>앱에서 결제하면 마켓 결제 수수료가 포함돼요</p>
        {pieceProducts.map((product) => (
          <button key={product.pieces}>
            <span><i>◆</i>{product.pieces.toLocaleString()}피스</span>
            <b>{product.price}</b>
          </button>
        ))}
      </section>
      <section className="notice">
        <h2>이용 안내</h2>
        <p>구매한 피스와 자동 충전으로 받은 보너스 피스는 서비스 정책에 따라 사용할 수 있어요. 환불 및 자세한 안내는 고객센터를 확인해주세요.</p>
        <Link to="/piece/history">피스 내역 보기</Link>
      </section>
    </main>
  )
}
