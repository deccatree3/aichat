import { supabase } from '../auth/supabase'

export interface PieceLedgerEntry {
  id: string
  amount: number
  reason: string
  description: string
  createdAt: string
}

interface LedgerRow {
  id: string
  amount: number
  reason: string
  description: string
  created_at: string
}

export const walletService = {
  async getBalance(userId: string, fallbackBalance: number): Promise<number> {
    if (!supabase) return fallbackBalance

    const { data, error } = await supabase
      .from('wallets')
      .select('piece_balance')
      .eq('mid', userId)
      .maybeSingle()

    if (error || !data) return fallbackBalance
    return Number((data as { piece_balance: number }).piece_balance)
  },

  async listLedger(userId: string): Promise<PieceLedgerEntry[]> {
    if (!supabase) return []

    const { data, error } = await supabase
      .from('piece_ledger')
      .select('id,amount,reason,description,created_at')
      .eq('mid', userId)
      .order('created_at', { ascending: false })

    if (error) return []

    return (data as LedgerRow[]).map((row) => ({
      id: row.id,
      amount: row.amount,
      reason: row.reason,
      description: row.description,
      createdAt: row.created_at,
    }))
  },
}
