import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { walletService } from '../db/walletService'
import type { PieceLedgerEntry } from '../db/walletService'

export default function PieceHistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ledger, setLedger] = useState<PieceLedgerEntry[]>([])

  useEffect(() => {
    let mounted = true
    if (!user) return undefined

    walletService.listLedger(user.id).then((entries) => {
      if (mounted) setLedger(entries)
    })

    return () => {
      mounted = false
    }
  }, [user])

  const hasLedger = ledger.length > 0
  return (
    <main className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="뒤로">‹</button>
        <h1>피스 내역</h1>
        <span />
      </header>
      {hasLedger ? (
        <section className="settings-list">
          {ledger.map((entry) => (
            <div className="settings-row" key={entry.id}>
              <span>
                <strong>{entry.description}</strong>
                <small>{new Date(entry.createdAt).toLocaleString('ko-KR')} · {entry.reason}</small>
              </span>
              <b>{entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()}</b>
            </div>
          ))}
        </section>
      ) : (
      <section className="empty-state">
        <strong>아직 피스 내역이 없어요</strong>
        <p>충전하거나 사용한 피스가 생기면 이곳에 표시됩니다.</p>
      </section>
      )}
    </main>
  )
}
