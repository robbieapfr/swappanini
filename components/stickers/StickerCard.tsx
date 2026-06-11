'use client'

import { useRef, useCallback } from 'react'
import type { Database } from '@/lib/supabase/types'
import type { UserSticker } from '@/hooks/useUserStickers'

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

  const countryCode = sticker.code?.slice(0, 2).toUpperCase() ?? '??'

  // State-based styles
  let bg: string, borderColor: string, borderDash: boolean, codeColor: string
  if (isDouble) {
    bg = 'white'; borderColor = '#00C241'; borderDash = false; codeColor = '#1B3B1A'
  } else if (isOwned) {
    bg = 'white'; borderColor = '#00C241'; borderDash = false; codeColor = '#1B3B1A'
  } else if (isPriority) {
    bg = '#f0fff4'; borderColor = '#AAFF00'; borderDash = true; codeColor = '#7CB900'
  } else {
    bg = 'white'; borderColor = '#86efac'; borderDash = true; codeColor = '#86efac'
  }

  return (
    <div
      className="relative rounded-xl select-none cursor-pointer active:scale-95
        transition-transform overflow-visible"
      style={{
        background: bg,
        border: `1.5px ${borderDash ? 'dashed' : 'solid'} ${borderColor}`,
        height: '52px',
        width: '100%',
      }}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
    >
      {/* Number */}
      <span
        className="absolute top-1 left-1.5 text-[9px] font-black leading-none"
        style={{ color: isOwned ? '#9ca3af' : codeColor }}
      >
        {sticker.number}
      </span>

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

      {/* Priority star */}
      {isPriority && !isOwned && (
        <span className="absolute -top-1.5 -right-1.5 text-[11px] leading-none z-10">⭐</span>
      )}

      {/* Country code centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="font-display font-black text-xs leading-none"
          style={{ color: codeColor }}
        >
          {countryCode}
        </span>
      </div>

      {/* Player name bottom */}
      {sticker.name && (
        <span
          className="absolute bottom-1 left-0 right-0 px-1 text-center
            text-[8px] font-medium truncate leading-none"
          style={{ color: isOwned ? '#6b7280' : codeColor, opacity: isOwned ? 1 : 0.8 }}
        >
          {sticker.name}
        </span>
      )}
    </div>
  )
}
