'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useUserStickers, type StickerMap } from '@/hooks/useUserStickers'
import { StickerCard } from './StickerCard'
import { StickerModal } from './StickerModal'
import type { Database } from '@/lib/supabase/types'
import { getFlagUrlByCountry, getCountryEmoji } from '@/lib/flags'
import { getGroupForCountry, getCountrySortIndex, WC_GROUPS } from '@/lib/sticker-groups'

type Sticker = Database['public']['Tables']['stickers']['Row']

interface CollectionGridProps {
  allStickers: Sticker[]
  initialUserStickers: StickerMap
}

const GROUP_COLORS: Record<string, string> = {
  A: '#2A6B35', // dark forest green
  B: '#C42B2B', // crimson red
  C: '#AAFF00', // lime
  D: '#2B5FAA', // medium blue
  E: '#D96820', // warm orange
  F: '#1A7070', // dark teal
  G: '#4B5B1A', // army green
  H: '#3AAAD0', // sky blue
  I: '#2B5FAA', // blue (same as D)
  J: '#D8888A', // soft pink/salmon
  K: '#BB2B77', // magenta
  L: '#7A1A28', // dark maroon
  FWC: '#8B9420', // olive yellow-green
  CC:  '#E30613', // Coca-Cola red
}

export function CollectionGrid({ allStickers, initialUserStickers }: CollectionGridProps) {
  const t = useTranslations('collection')
  const { stickers, increment, setQuantity, togglePriority, remove } =
    useUserStickers(initialUserStickers)

  const [search, setSearch] = useState('')
  const [modalSticker, setModalSticker] = useState<Sticker | null>(null)
  const priorityCount = Object.values(stickers).filter((s) => (s.priority ?? 0) > 0).length

  // All groups expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(WC_GROUPS.map((g) => g.id))
  )
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set())

  // Stats
  const stats = useMemo(() => {
    const owned = allStickers.filter((s) => (stickers[s.id]?.quantity ?? 0) >= 1).length
    const doubles = allStickers.filter((s) => (stickers[s.id]?.quantity ?? 0) >= 2).length
    const total = allStickers.length
    const pct = Math.round((owned / total) * 100)
    return { owned, doubles, pct, total }
  }, [stickers, allStickers])

  // Group by country, sorted by WC group order
  const byCountry = useMemo(() => {
    const q = search.toLowerCase().trim()
    const map = new Map<string, Sticker[]>()
    for (const s of allStickers) {
      if (q) {
        const hay = `${s.country} ${s.name ?? ''} ${s.code}`.toLowerCase()
        if (!hay.includes(q)) continue
      }
      if (!map.has(s.country)) map.set(s.country, [])
      map.get(s.country)!.push(s)
    }
    return Array.from(map.entries())
      .map(([country, items]) => {
        const code = items[0]?.code ?? ''
        const flagUrl = getFlagUrlByCountry(country)
        const emoji = getCountryEmoji(country)
        const owned = items.filter((s) => (stickers[s.id]?.quantity ?? 0) >= 1).length
        return { country, code, flagUrl, emoji, items, owned, total: items.length }
      })
      .sort((a, b) => getCountrySortIndex(a.country) - getCountrySortIndex(b.country))
  }, [allStickers, stickers, search])

  // Group entries by WC group for rendering
  const grouped = useMemo(() => {
    const result: { groupId: string; groupLabel: string; entries: typeof byCountry }[] = []
    let currentGroupId: string | null = null
    for (const entry of byCountry) {
      const g = getGroupForCountry(entry.country)
      const gId = g?.id ?? 'OTHER'
      const gLabel = g?.label ?? ''
      if (gId !== currentGroupId) {
        currentGroupId = gId
        result.push({ groupId: gId, groupLabel: gLabel, entries: [] })
      }
      result[result.length - 1].entries.push(entry)
    }
    return result
  }, [byCountry])

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

  const toggleCountry = useCallback((country: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev)
      if (next.has(country)) next.delete(country)
      else next.add(country)
      return next
    })
  }, [])

  const stickerByIdMap = useMemo(() => new Map(allStickers.map((s) => [s.id, s])), [allStickers])
  const openModal = useCallback((id: number) => {
    const s = stickerByIdMap.get(id)
    if (s) setModalSticker(s)
  }, [stickerByIdMap])
  const closeModal = useCallback(() => setModalSticker(null), [])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Stats + search ── */}
      <div className="px-4 pt-3 pb-3 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatPill value={stats.owned} label={t('owned_label')} variant="gray" />
          <StatPill value={stats.doubles} label={t('doubles_label')} variant="lime" />
          <StatPill value={`${stats.pct}%`} label={t('complete_label')} variant="green" />
        </div>
        <div className="relative">
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm
              outline-none focus:border-gray-400 transition-colors bg-white"
          />
        </div>
      </div>

      {/* ── Country list grouped by WC group ── */}
      <div className="flex-1 pb-6 px-3 pt-3">
        {grouped.map(({ groupId, groupLabel, entries }) => {
          const isGroupExpanded = expandedGroups.has(groupId)
          const color = GROUP_COLORS[groupId] ?? '#6b7280'
          const isFWC = groupId === 'FWC'

          return (
            <div key={groupId} className="mb-3">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(groupId)}
                className="w-full flex items-center gap-2 py-1.5 px-1 mb-2"
              >
                {/* "GROUPE X" label */}
                <span
                  className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap flex-shrink-0"
                  style={{ color }}
                >
                  {isFWC ? '⭐ SPÉCIAL COUPE DU MONDE' : groupId === 'CC' ? '🥤 SPÉCIAL COCA-COLA' : `GROUPE ${groupId}`}
                </span>

                {/* Colored divider line */}
                <div
                  className="flex-1 h-0.5 rounded-full"
                  style={{ background: color, opacity: 0.5 }}
                />

                {/* Chevron */}
                <span
                  className="text-xs flex-shrink-0 transition-transform duration-200"
                  style={{
                    display: 'inline-block',
                    color,
                    transform: isGroupExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Countries */}
              {isGroupExpanded && (
                <div className="space-y-2">
                  {entries.map(({ country, flagUrl, emoji, items, owned, total }) => {
                    const isExpanded = expandedCountries.has(country)
                    const isComplete = owned === total
                    const pct = total > 0 ? Math.round((owned / total) * 100) : 0

                    return (
                      <div
                        key={country}
                        className="bg-white rounded-2xl overflow-hidden"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
                      >
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3
                            active:bg-gray-50 transition-colors text-left"
                          onClick={() => toggleCountry(country)}
                        >
                          {/* Flag image or special emblem */}
                          <div className="w-8 h-6 flex items-center justify-center flex-shrink-0 overflow-hidden rounded-sm">
                            {flagUrl ? (
                              <img
                                src={flagUrl}
                                alt={country}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : emoji ? (
                              <span className="text-lg leading-none">{emoji}</span>
                            ) : (
                              <span
                                className="text-[10px] font-black rounded px-1"
                                style={{ background: '#f3f4f6', color: '#6b7280' }}
                              >
                                ?
                              </span>
                            )}
                          </div>

                          {/* Country name + progress bar */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sm truncate" style={{ color: '#1B3B1A' }}>
                                {country}
                                {isComplete && (
                                  <span className="ml-1.5 text-xs" style={{ color: '#00C241' }}>✓</span>
                                )}
                              </span>
                              <span className="text-xs font-semibold text-gray-400 flex-shrink-0 ml-2">
                                {owned}/{total}
                              </span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  background: isComplete ? '#00C241' : '#AAFF00',
                                }}
                              />
                            </div>
                          </div>

                          {/* Chevron */}
                          <span
                            className="text-gray-300 text-xs flex-shrink-0 ml-1 transition-transform duration-200"
                            style={{
                              display: 'inline-block',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                          >
                            ▼
                          </span>
                        </button>

                        {/* Sticker grid */}
                        {isExpanded && (
                          <div className="bg-gray-50 px-3 pt-3 pb-4 border-t border-gray-100">
                            <div className="grid grid-cols-5 gap-1.5">
                              {items.map((s) => (
                                <StickerCard
                                  key={s.id}
                                  sticker={s}
                                  userSticker={stickers[s.id]}
                                  onTap={increment}
                                  onLongPress={openModal}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

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

// ── Stat pill ──────────────────────────────────────────────
function StatPill({
  value,
  label,
  variant,
}: {
  value: string | number
  label: string
  variant: 'gray' | 'lime' | 'green'
}) {
  const styles = {
    gray:  { bg: '#f3f4f6', color: '#1B3B1A', border: '#e5e7eb' },
    lime:  { bg: '#AAFF00', color: '#1B3B1A', border: '#AAFF00' },
    green: { bg: '#00C241', color: '#ffffff', border: '#00C241' },
  }
  const s = styles[variant]

  return (
    <div
      className="flex flex-col items-center justify-center py-3 rounded-2xl border"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <span
        className="font-display text-2xl font-black leading-none"
        style={{ color: s.color }}
      >
        {value}
      </span>
      <span
        className="text-[10px] font-black uppercase tracking-wider mt-1"
        style={{ color: variant === 'green' ? 'rgba(255,255,255,0.7)' : '#6b7280' }}
      >
        {label}
      </span>
    </div>
  )
}
