import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { walletService } from '../db/walletService'
import { pieceProductService } from '../db/pieceProductService'
import type { PieceProduct } from '../db/pieceProductService'

export default function PieceChargePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [balance, setBalance] = useState(user?.pieces ?? 0)
  const [products, setProducts] = useState<PieceProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

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

  useEffect(() => {
    let mounted = true

    pieceProductService
      .listActive()
      .then((items) => {
        if (mounted) setProducts(items)
      })
      .finally(() => {
        if (mounted) setLoadingProducts(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="page piece-page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="뒤로">←</button>
        <h1>피스충전</h1>
        <span />
      </header>
      <section className="piece-balance">
        <span className="coin">◆</span>
        <strong>내 피스 {balance.toLocaleString()}</strong>
      </section>
      <section className="promo">
        <strong>결제 상품은 DB에 등록된 상품만 표시됩니다</strong>
        <span>DB</span>
      </section>
      <section className="product-list">
        <h2>피스 충전</h2>
        <p>운영자가 등록한 활성 상품만 표시돼요.</p>
        {loadingProducts && <p className="notice-state">불러오는 중입니다.</p>}
        {!loadingProducts && products.length === 0 && <p className="notice-state">등록된 충전 상품이 없습니다.</p>}
        {products.map((product) => (
          <button key={product.id}>
            <span>
              <i>◆</i>{product.pieces.toLocaleString()}피스
              {product.bonusPieces > 0 ? ` + ${product.bonusPieces.toLocaleString()}` : ''}
            </span>
            <b>{product.priceKrw.toLocaleString()}원</b>
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
