'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { getDisplayCode } from '@/lib/flags'
import type { MatchWithStickers } from '@/lib/matching/queries'

interface MatchCardProps {
  match: MatchWithStickers
  locale: string
}

export function MatchCard({ match, locale }: MatchCardProps) {
  const t = useTranslations('playground')
  const initial = match.pseudo[0]?.toUpperCase() ?? '?'
  const location = [match.city, match.country].filter(Boolean).join(', ')

  const previewStickers = match.stickers_i_receive.slice(0, 3)
  const overflow = match.stickers_i_receive.length - 3

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
      {/* ── Top row: avatar + info + location pin ── */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center
            font-display text-xl font-black flex-shrink-0 border-2"
          style={{ background: 'white', borderColor: '#00C241', color: '#00C241' }}
        >
          {initial}
        </div>

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-sm" style={{ color: '#1B3B1A' }}>
              {match.pseudo}
            </span>
            {location && (
              <span className="text-xs text-gray-400 font-medium truncate">
                — {location}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {t('gives_label')} <strong>{match.i_give_count}</strong>
            {' · '}
            {t('gets_label')} <strong>{match.i_get_count}</strong>
          </p>
        </div>

        {/* Location pin */}
        <svg
          className="flex-shrink-0 text-gray-300"
          width="18" height="18" viewBox="0 0 24 24" fill="none"
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
            fill="currentColor"
          />
          <circle cx="12" cy="9" r="2.5" fill="white" />
        </svg>
      </div>

      {/* ── Sticker previews ── */}
      {previewStickers.length > 0 && (
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-2"
            style={{ color: '#6b7280' }}
          >
            {t('you_receive')}
          </p>
          <div className="flex gap-2">
            {previewStickers.map((s) => (
              <StickerPreview key={s.id} sticker={s} />
            ))}
            {overflow > 0 && (
              <div
                className="w-14 rounded-xl flex items-center justify-center
                  text-sm font-black text-gray-400 bg-gray-100 border border-gray-200"
                style={{ minHeight: '64px' }}
              >
                +{overflow}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="flex justify-end">
        <Link
          href={`/${locale}/propose/${match.id}`}
          className="px-5 py-2.5 rounded-full font-black text-sm
            transition-all active:scale-[0.97] inline-block"
          style={{ background: '#00C241', color: 'white' }}
        >
          {t('propose_swap')}
        </Link>
      </div>
    </div>
  )
}

function StickerPreview({
  sticker,
}: {
  sticker: { id: number; number: number; name: string | null; code: string; country: string }
}) {
  const code = getDisplayCode(sticker.country, sticker.code)

  return (
    <div
      className="w-14 rounded-xl flex flex-col items-center justify-between
        py-1.5 px-1 border flex-shrink-0"
      style={{
        minHeight: '64px',
        background: 'linear-gradient(145deg, #fecaca, #fca5a5)',
        borderColor: '#f87171',
      }}
    >
      <span className="text-[9px] font-black text-red-700 self-start leading-none">
        #{sticker.number}
      </span>
      <span className="font-black text-sm text-red-800 leading-none">{code}</span>
      {sticker.name && (
        <span className="text-[8px] font-medium text-red-700 text-center leading-tight truncate w-full px-0.5">
          {sticker.name}
        </span>
      )}
    </div>
  )
}
