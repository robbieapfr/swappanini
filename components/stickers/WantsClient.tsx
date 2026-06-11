'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useUserStickers, type StickerMap } from '@/hooks/useUserStickers'
import { StickerCard } from './StickerCard'
import { StickerModal } from './StickerModal'
import { getCountrySortIndex } from '@/lib/sticker-groups'
import { getFlagUrlByCountry, getCountryEmoji } from '@/lib/flags'
import type { Database } from '@/lib/supabase/types'

type Sticker = Database['public']['Tables']['stickers']['Row']

interface WantsClientProps {
  allStickers: Sticker[]
  initialUserStickers: StickerMap
  topWanted: Sticker[]
  topRare: Sticker[]
  locale: string
}

const PAGE_SIZE = 100

export function WantsClient({
  allStickers,
  initialUserStickers,
  topWanted,
  topRare,
  locale,
}: WantsClientProps) {
  const t = useTranslations('wants')
  const { stickers, increment, setQuantity, togglePriority, remove, priorityCount } =
    useUserStickers(initialUserStickers)

  const [modalSticker, setModalSticker] = useState<Sticker | null>(null)
  const [search, setSearch] = useState('')
  const [showCount, setShowCount] = useState(PAGE_SIZE)

  const missingRef = useRef<HTMLDivElement>(null)

  const stickerById = useMemo(() => new Map(allStickers.map((s) => [s.id, s])), [allStickers])
  const openModal = useCallback((id: number) => {
    const s = stickerById.get(id)
    if (s) setModalSticker(s)
  }, [stickerById])
  const closeModal = useCallback(() => setModalSticker(null), [])

  // Priority stickers (sorted by priority level)
  const priorityStickers = useMemo(() =>
    allStickers
      .filter((s) => (stickers[s.id]?.priority ?? 0) > 0)
      .sort((a, b) => (stickers[a.id]?.priority ?? 0) - (stickers[b.id]?.priority ?? 0)),
    [allStickers, stickers]
  )

  // Missing stickers (not owned) with search, ordered by country (WC group order)
  const missingStickers = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allStickers
      .filter((s) => {
        if ((stickers[s.id]?.quantity ?? 0) >= 1) return false
        if (q) {
          const hay = `${s.country} ${s.name ?? ''} ${s.code}`.toLowerCase()
          return hay.includes(q)
        }
        return true
      })
      .sort((a, b) =>
        getCountrySortIndex(a.country) - getCountrySortIndex(b.country) || a.number - b.number
      )
  }, [allStickers, stickers, search])

  const visibleMissing = missingStickers.slice(0, showCount)

  // Group the visible slice by country for organised rendering
  const missingByCountry = useMemo(() => {
    const groups: { country: string; flagUrl: string; emoji: string; items: Sticker[] }[] = []
    let current: (typeof groups)[number] | null = null
    for (const s of visibleMissing) {
      if (!current || current.country !== s.country) {
        current = {
          country: s.country,
          flagUrl: getFlagUrlByCountry(s.country),
          emoji: getCountryEmoji(s.country),
          items: [],
        }
        groups.push(current)
      }
      current.items.push(s)
    }
    return groups
  }, [visibleMissing])

  const scrollToMissing = useCallback(() => {
    missingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="px-4 pb-28 space-y-8">

      {/* ── 1. Priorités ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-black" style={{ color: '#00C241' }}>
            ★ {t('priorities_title')}
          </h2>
          <span
            className="text-sm font-black px-2 py-0.5 rounded-lg"
            style={{ background: '#f3f4f6', color: priorityCount >= 5 ? '#00C241' : '#6b7280' }}
          >
            {priorityCount}/5
          </span>
        </div>

        <div className="flex gap-2 items-stretch">
          {priorityStickers.map((s) => (
            <div key={s.id} className="flex-shrink-0" style={{ width: 'calc((100vw - 64px) / 5)', maxWidth: '80px' }}>
              <StickerCard
                sticker={s}
                userSticker={stickers[s.id]}
                onTap={openModal}
                onLongPress={openModal}
              />
            </div>
          ))}

          {priorityCount === 0 && (
            <p className="text-sm text-gray-400 font-medium self-center">{t('priorities_empty')}</p>
          )}

          {priorityCount < 5 && (
            <button
              onClick={scrollToMissing}
              className="flex-shrink-0 rounded-xl border-2 border-dashed text-sm font-black transition-opacity active:opacity-70 px-3"
              style={{ borderColor: '#00C241', color: '#00C241', width: 'calc((100vw - 64px) / 5)', maxWidth: '80px', minHeight: '52px' }}
            >
              +
            </button>
          )}
        </div>
      </section>

      {/* ── 2. Top 10 plus recherchés ── */}
      {topWanted.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-black mb-3" style={{ color: '#00C241' }}>
            🔥 {t('top_wanted_title')}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {topWanted.map((s) => (
              <div key={s.id} className="flex-shrink-0" style={{ width: 'calc((100vw - 64px) / 5)', maxWidth: '80px' }}>
                <StickerCard
                  sticker={s}
                  userSticker={stickers[s.id]}
                  onTap={openModal}
                  onLongPress={openModal}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Top 10 plus rares ── */}
      {topRare.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-black mb-3" style={{ color: '#00C241' }}>
            💎 {t('top_rare_title')}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {topRare.map((s) => (
              <div key={s.id} className="flex-shrink-0" style={{ width: 'calc((100vw - 64px) / 5)', maxWidth: '80px' }}>
                <StickerCard
                  sticker={s}
                  userSticker={stickers[s.id]}
                  onTap={openModal}
                  onLongPress={openModal}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Mes manques ── */}
      <section ref={missingRef}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-black" style={{ color: '#00C241' }}>
            {t('missing_title', { count: missingStickers.length })}
          </h2>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowCount(PAGE_SIZE) }}
            placeholder={t('search_missing')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm
              outline-none focus:border-gray-400 transition-colors bg-white"
          />
        </div>

        {missingStickers.length === 0 ? (
          <div className="rounded-2xl px-5 py-8 text-center" style={{ background: '#f0fdf4' }}>
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-black text-base" style={{ color: '#00C241' }}>
              {t('complete_title')}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {missingByCountry.map((group) => (
                <div key={group.country}>
                  {/* Country header */}
                  <div className="flex items-center gap-2 mb-2">
                    {group.flagUrl ? (
                      <img src={group.flagUrl} alt={group.country} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" loading="lazy" />
                    ) : group.emoji ? (
                      <span className="text-base leading-none">{group.emoji}</span>
                    ) : null}
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#1B3B1A' }}>
                      {group.country}
                    </span>
                    <span className="text-xs font-bold text-gray-300">{group.items.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((s) => (
                      <div key={s.id} className="flex-shrink-0" style={{ width: 'calc((100vw - 64px) / 5)', maxWidth: '80px' }}>
                        <StickerCard
                          sticker={s}
                          userSticker={stickers[s.id]}
                          onTap={openModal}
                          onLongPress={openModal}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {showCount < missingStickers.length && (
              <button
                onClick={() => setShowCount((n) => n + PAGE_SIZE)}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 active:opacity-70"
              >
                {t('show_more', { remaining: missingStickers.length - showCount })}
              </button>
            )}
          </>
        )}
      </section>

      {/* ── CTA Voir mes matchs ── */}
      <Link href={`/${locale}/playground`}>
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between active:opacity-90"
          style={{ background: '#00C241' }}
        >
          <div>
            <p className="font-black text-white text-base">{t('cta_matches')}</p>
            <p className="text-white/70 text-xs font-medium mt-0.5">{t('cta_matches_desc')}</p>
          </div>
          <span className="text-white text-xl font-black">→</span>
        </div>
      </Link>

      {/* ── Modal ── */}
      {modalSticker && (
        <StickerModal
          sticker={modalSticker}
          state={stickers[modalSticker.id]}
          priorityCount={priorityCount}
          onClose={closeModal}
          onSetQuantity={(qty) => setQuantity(modalSticker.id, qty)}
          onTogglePriority={() => togglePriority(modalSticker.id)}
          onRemove={() => remove(modalSticker.id)}
        />
      )}
    </div>
  )
}
