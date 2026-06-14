import { supabase } from '../auth/supabase'

export interface PieceProduct {
  id: number
  pieces: number
  priceKrw: number
  bonusPieces: number
  label: string | null
}

interface PieceProductRow {
  id: number
  pieces: number
  price_krw: number
  bonus_pieces: number
  label: string | null
}

function toProduct(row: PieceProductRow): PieceProduct {
  return {
    id: Number(row.id),
    pieces: Number(row.pieces),
    priceKrw: Number(row.price_krw),
    bonusPieces: Number(row.bonus_pieces ?? 0),
    label: row.label,
  }
}

export const pieceProductService = {
  async listActive(): Promise<PieceProduct[]> {
    if (!supabase) return []

    const { data, error } = await supabase
      .from('piece_products')
      .select('id,pieces,price_krw,bonus_pieces,label')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('pieces', { ascending: true })

    if (error) return []
    return (data as PieceProductRow[]).map(toProduct)
  },
}
