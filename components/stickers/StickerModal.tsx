'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import type { Database } from '@/lib/supabase/types'
import type { StickerState } from '@/hooks/useUserStickers'

type Sticker = Database['public']['Tables']['stickers']['Row']

interface StickerModalProps {
  sticker: Sticker
  state: StickerState | undefined
  priorityCount: number
  onSetQuantity: (qty: number) => void
  onTogglePriority: () => void
  onRemove: () => void
  onClose: () => void
}

export function StickerModal({
  sticker,
  state,
  priorityCount,
  onSetQuantity,
  onTogglePriority,
  onRemove,
  onClose,
}: StickerModalProps) {
  const t = useTranslations('sticker')
  const tc = useTranslations('common')
  const overlayRef = useRef<HTMLDivElement>(null)

  const qty = state?.quantity ?? 0
  const hasPriority = !!state?.priority
  const canAddPriority = hasPriority || priorityCount < 5

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const typeLabel =
    sticker.type === 'Joueur' ? t('type_player')
    : sticker.type === 'Foil/Spécial' ? t('type_foil')
    : t('type_team')

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Sheet */}
      <div className="w-full max-w-sm bg-white rounded-t-3xl px-6 pt-5 pb-10 animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">
              {sticker.code} · {typeLabel}
            </p>
            <h2 className="font-display text-xl text-gray-900 leading-tight">
              {sticker.name ?? sticker.code}
            </h2>
            {sticker.club && (
              <p className="text-sm text-gray-400 font-medium mt-0.5">{sticker.club}</p>
            )}
          </div>
          {sticker.type === 'Foil/Spécial' && (
            <span className="text-xs font-black bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg">
              {t('foil_badge')}
            </span>
          )}
        </div>

        {/* Quantity stepper */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4 mb-3">
          <span className="text-sm font-black text-gray-700">{t('quantity_label')}</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onSetQuantity(Math.max(0, qty - 1))}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 font-black text-lg
                flex items-center justify-center active:scale-90 transition-transform"
            >
              −
            </button>
            <span className="font-black text-xl w-6 text-center" style={{ color: '#1B3B1A' }}>
              {qty}
            </span>
            <button
              onClick={() => onSetQuantity(qty + 1)}
              className="w-9 h-9 rounded-xl font-black text-lg
                flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: '#AAFF00', color: '#1B3B1A' }}
            >
              +
            </button>
          </div>
        </div>

        {/* Priority toggle */}
        <button
          onClick={onTogglePriority}
          disabled={!canAddPriority && !hasPriority}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl mb-3
            transition-all disabled:opacity-40
            ${hasPriority
              ? 'bg-[#00C241] text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
        >
          <span className="text-sm font-black">{t('priority_label')}</span>
          <div className="flex items-center gap-2">
            {!hasPriority && (
              <span className="text-xs text-gray-400 font-medium">{priorityCount}/5</span>
            )}
            <span className="text-lg">{hasPriority ? '⭐' : '☆'}</span>
          </div>
        </button>

        {/* Remove */}
        {qty > 0 && (
          <button
            onClick={() => { onRemove(); onClose() }}
            className="w-full py-3.5 rounded-2xl text-sm font-black text-red-500
              bg-red-50 hover:bg-red-100 transition-colors"
          >
            {t('remove')}
          </button>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-3 mt-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          {tc('close')}
        </button>
      </div>
    </div>
  )
}
