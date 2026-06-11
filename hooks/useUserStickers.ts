'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { upsertSticker } from '@/lib/stickers/actions'

export type StickerState = {
  quantity: number
  priority: number | null
}

/** Alias for external use */
export type UserSticker = StickerState

export type StickerMap = Record<number, StickerState>

const DEBOUNCE_MS = 500

export function useUserStickers(initial: StickerMap) {
  const [stickers, setStickers] = useState<StickerMap>(initial)
  const debounceMap = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  // Latest intended value per sticker id that still needs to be written.
  const pendingRef = useRef<Record<number, StickerState>>({})

  const writeNow = useCallback((id: number, value: StickerState) => {
    delete pendingRef.current[id]
    if (debounceMap.current[id]) {
      clearTimeout(debounceMap.current[id])
      delete debounceMap.current[id]
    }
    upsertSticker(id, value.quantity, value.priority).then((res) => {
      if (res?.error) console.error('upsertSticker failed', id, res.error)
    })
  }, [])

  const sync = useCallback((id: number, qty: number, priority: number | null) => {
    pendingRef.current[id] = { quantity: qty, priority }
    if (debounceMap.current[id]) clearTimeout(debounceMap.current[id])
    debounceMap.current[id] = setTimeout(() => {
      const value = pendingRef.current[id]
      if (value) writeNow(id, value)
    }, DEBOUNCE_MS)
  }, [writeNow])

  // Flush every pending write immediately — used when the page is about to be
  // hidden/closed so mobile timer throttling can't drop the write.
  const flushAll = useCallback(() => {
    for (const idStr of Object.keys(pendingRef.current)) {
      const id = Number(idStr)
      const value = pendingRef.current[id]
      if (value) writeNow(id, value)
    }
  }, [writeNow])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushAll()
    }
    window.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flushAll)
    return () => {
      window.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flushAll)
      flushAll()
    }
  }, [flushAll])

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
      if (qty <= 0 && !priority) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { quantity: Math.max(0, qty), priority } }
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
        writeNow(id, { quantity: 0, priority: null })
        const next = { ...prev }
        delete next[id]
        return next
      }

      sync(id, current.quantity, newPriority)
      return { ...prev, [id]: { quantity: current.quantity, priority: newPriority } }
    })
  }, [sync, writeNow])

  /** Remove sticker from collection */
  const remove = useCallback((id: number) => {
    setStickers((prev) => {
      writeNow(id, { quantity: 0, priority: null })
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [writeNow])

  const priorityCount = Object.values(stickers).filter((s) => (s.priority ?? 0) > 0).length

  return { stickers, increment, setQuantity, togglePriority, remove, priorityCount }
}
