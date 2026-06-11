'use client'

import { useRef, useCallback } from 'react'
import type { Database } from '@/lib/supabase/types'
import type { UserSticker } from '@/hooks/useUserStickers'
import { getDisplayCode, getCountryEmoji } from '@/lib/flags'

type Sticker = Database['public']['Tables']['stickers']['Row']

interface StickerCardProps {
  sticker: Sticker
  userSticker?: UserSticker
  onTap: (id: number) => void
  onLongPress: (id: number) => void
}

const LONG_PRESS_MS = 500

export function StickerCard({ sticker, userSticker, onTap, onLongPress }: StickerCardProps) {
  const qty = userSticker?.quantity ?? 0
  const isPriority = (userSticker?.priority ?? 0) > 0
  const isOwned = qty >= 1
  const isDouble = qty >= 2
  const extraQty = qty - 1

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const startPress = useCallback(() => {
    didLongPress.current = false
    timerRef.current = setTimeout(() => {
      didLongPress.current = true
      onLongPress(sticker.id)
    }, LONG_PRESS_MS)
  }, [sticker.id, onLongPress])

  const endPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!didLongPress.current) onTap(sticker.id)
  }, [sticker.id, onTap])

  const cancelPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    didLongPress.current = true
  }, [])

  const emoji = getCountryEmoji(sticker.country)
  const code = getDisplayCode(sticker.country, sticker.code)

  // ── State-based styles ──────────────────────────────────────
  // double  → filled green (stands out as swappable)
  // owned   → white with solid green outline
  // priority(missing) → amber tint, dashed, starred
  // missing → neutral gray "empty slot"
  let bg: string, borderColor: string, borderStyle: 'solid' | 'dashed', textColor: string, numColor: string
  if (isDouble) {
    bg = '#00C241'; borderColor = '#00C241'; borderStyle = 'solid'; textColor = '#ffffff'; numColor = 'rgba(255,255,255,0.75)'
  } else if (isOwned) {
    bg = '#ffffff'; borderColor = '#00C241'; borderStyle = 'solid'; textColor = '#1B3B1A'; numColor = '#9ca3af'
  } else if (isPriority) {
    bg = '#FFFBEB'; borderColor = '#F59E0B'; borderStyle = 'dashed'; textColor = '#B45309'; numColor = '#D9923B'
  } else {
    bg = '#F3F4F6'; borderColor = '#E5E7EB'; borderStyle = 'solid'; textColor = '#9CA3AF'; numColor = '#C4C9D0'
  }

  return (
    <div
      className="relative rounded-xl select-none cursor-pointer active:scale-95
        transition-transform overflow-visible"
      style={{
        background: bg,
        border: `1.5px ${borderStyle} ${borderColor}`,
        height: '52px',
        width: '100%',
      }}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
    >
      {/* Double badge */}
      {isDouble && extraQty > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 text-[9px] font-black
            px-1 py-0.5 rounded-md leading-none z-10"
          style={{ background: '#AAFF00', color: '#1B3B1A' }}
        >
          +{extraQty}
        </span>
      )}

      {/* Priority star (missing but pinned) */}
      {isPriority && !isOwned && (
        <span className="absolute -top-1.5 -right-1.5 text-[11px] leading-none z-10">⭐</span>
      )}

      {/* Center: code + number on the same line, name below */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1 pointer-events-none">
        <div className="flex items-baseline gap-1 leading-none">
          <span className="font-display font-black text-xs" style={{ color: textColor }}>
            {emoji || code}
          </span>
          <span className="text-xs font-bold leading-none" style={{ color: numColor }}>
            {sticker.number}
          </span>
        </div>
        {sticker.name && (
          <span
            className="mt-0.5 px-0.5 text-center text-[8px] font-medium truncate leading-none w-full"
            style={{ color: textColor, opacity: 0.85 }}
          >
            {sticker.name}
          </span>
        )}
      </div>
    </div>
  )
}
