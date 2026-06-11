'use client'

import { useState, useCallback, useRef } from 'react'
import { upsertSticker } from '@/lib/stickers/actions'

export type StickerState = {
  quantity: number
  priority: number | null
}

/** Alias for external use */
export type UserSticker = StickerState

export type StickerMap = Record<number, StickerState>

export function useUserStickers(initial: StickerMap) {
  const [stickers, setStickers] = useState<StickerMap>(initial)
  const debounceMap = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  const sync = useCallback((id: number, qty: number, priority: number | null) => {
    if (debounceMap.current[id]) clearTimeout(debounceMap.current[id])
    debounceMap.current[id] = setTimeout(() => {
      upsertSticker(id, qty, priority)
    }, 800)
  }, [])

  /** Tap: missing → 1, owned → +1 */
  const increment = useCallback((id: number) => {
    setStickers((prev) => {
      const current = prev[id]?.quantity ?? 0
      const next = current === 0 ? 1 : current + 1
      const priority = prev[id]?.priority ?? null
      sync(id, next, priority)
      return { ...prev, [id]: { quantity: next, priority } }
    })
  }, [sync])

  /** Set exact quantity (from modal) */
  const setQuantity = useCallback((id: number, qty: number) => {
    setStickers((prev) => {
      const priority = prev[id]?.priority ?? null
      sync(id, qty, priority)
      if (qty <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { quantity: qty, priority } }
    })
  }, [sync])

  /** Toggle priority — works on MISSING stickers too (quantity=0, priority>0) */
  const togglePriority = useCallback((id: number) => {
    setStickers((prev) => {
      const current = prev[id] ?? { quantity: 0, priority: null }
      const priorityCount = Object.values(prev).filter((s) => (s.priority ?? 0) > 0).length
      const hasPriority = (current.priority ?? 0) > 0

      if (!hasPriority && priorityCount >= 5) return prev // max 5

      const newPriority = hasPriority ? null : priorityCount + 1

      if (newPriority === null && current.quantity === 0) {
        // Remove the row entirely (was only there for priority)
        upsertSticker(id, 0, null)
        const next = { ...prev }
        delete next[id]
        return next
      }

      sync(id, current.quantity, newPriority)
      return { ...prev, [id]: { quantity: current.quantity, priority: newPriority } }
    })
  }, [sync])

  /** Remove sticker from collection */
  const remove = useCallback((id: number) => {
    setStickers((prev) => {
      if (debounceMap.current[id]) clearTimeout(debounceMap.current[id])
      upsertSticker(id, 0, null)
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const priorityCount = Object.values(stickers).filter((s) => s.priority !== null).length

  return { stickers, increment, setQuantity, togglePriority, remove, priorityCount }
}
